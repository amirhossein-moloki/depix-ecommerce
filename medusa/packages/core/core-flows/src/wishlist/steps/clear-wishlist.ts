import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ClearWishlistStepInput = {
  customer_id: string
}

export const clearWishlistStepId = "clear-wishlist"

export const clearWishlistStep = createStep(
  clearWishlistStepId,
  async (input: ClearWishlistStepInput, { container }) => {
    const wishlistService = container.resolve<any>(Modules.WISHLIST)

    const [wishlists] = await wishlistService.listAndCountWishlists(
      { customer_id: input.customer_id },
      { relations: ["items"] }
    )

    const wishlist = wishlists[0]
    if (!wishlist || !wishlist.items?.length) {
      return new StepResponse({ success: true, deletedCount: 0 })
    }

    const itemIds = wishlist.items.map((i: any) => i.id)
    await wishlistService.deleteWishlistItems(itemIds)

    return new StepResponse(
      { success: true, deletedCount: itemIds.length },
      wishlist.items
    )
  }
)
