import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type RemoveWishlistItemStepInput = {
  customer_id: string
  wishlist_item_id: string
}

export const removeWishlistItemStepId = "remove-wishlist-item"

export const removeWishlistItemStep = createStep(
  removeWishlistItemStepId,
  async (input: RemoveWishlistItemStepInput, { container }) => {
    const wishlistService = container.resolve<any>(Modules.WISHLIST)

    const [wishlists] = await wishlistService.listAndCountWishlists(
      { customer_id: input.customer_id },
      { relations: ["items"] }
    )

    const wishlist = wishlists[0]
    if (!wishlist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Wishlist item not found"
      )
    }

    const item = (wishlist.items || []).find(
      (i: any) => i.id === input.wishlist_item_id
    )

    if (!item) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Wishlist item not found"
      )
    }

    await wishlistService.deleteWishlistItems([input.wishlist_item_id])

    return new StepResponse({ id: input.wishlist_item_id }, item)
  },
  async (itemData, { container }) => {
    if (itemData) {
      const wishlistService = container.resolve<any>(Modules.WISHLIST)
      await wishlistService.createWishlistItems({
        wishlist_id: itemData.wishlist_id,
        product_id: itemData.product_id,
        variant_id: itemData.variant_id ?? null,
      })
    }
  }
)
