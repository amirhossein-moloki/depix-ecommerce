import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CreateWishlistItemStepInput = {
  customer_id: string
  product_id: string
  variant_id?: string | null
}

export const createWishlistItemStepId = "create-wishlist-item"

export const createWishlistItemStep = createStep(
  createWishlistItemStepId,
  async (input: CreateWishlistItemStepInput, { container }) => {
    const wishlistService = container.resolve<any>(Modules.WISHLIST)
    const productService = container.resolve<any>(Modules.PRODUCT)

    // 1. Verify product exists
    try {
      await productService.retrieveProduct(input.product_id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${input.product_id} not found`
      )
    }

    // 2. Verify variant exists if provided
    if (input.variant_id) {
      try {
        await productService.retrieveProductVariant(input.variant_id)
      } catch {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product variant with id ${input.variant_id} not found`
        )
      }
    }

    // 3. Find or create wishlist for customer
    const [wishlists] = await wishlistService.listAndCountWishlists(
      { customer_id: input.customer_id },
      { relations: ["items"] }
    )

    let wishlist = wishlists[0]
    if (!wishlist) {
      wishlist = await wishlistService.createWishlists({
        customer_id: input.customer_id,
      })
      wishlist.items = []
    }

    // 4. Duplicate protection / Idempotency check
    const existingItem = (wishlist.items || []).find((item: any) => {
      const sameProduct = item.product_id === input.product_id
      if (input.variant_id) {
        return sameProduct && item.variant_id === input.variant_id
      }
      return sameProduct
    })

    if (existingItem) {
      return new StepResponse(existingItem, { createdId: null })
    }

    // 5. Create new wishlist item
    const newItem = await wishlistService.createWishlistItems({
      wishlist_id: wishlist.id,
      product_id: input.product_id,
      variant_id: input.variant_id ?? null,
    })

    return new StepResponse(newItem, { createdId: newItem.id })
  },
  async (compensateData, { container }) => {
    if (compensateData?.createdId) {
      const wishlistService = container.resolve<any>(Modules.WISHLIST)
      await wishlistService.deleteWishlistItems([compensateData.createdId])
    }
  }
)
