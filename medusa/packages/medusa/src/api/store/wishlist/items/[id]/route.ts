import { removeWishlistItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to modify wishlist"
    )
  }

  const wishlistItemId = req.params.id

  await removeWishlistItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      wishlist_item_id: wishlistItemId,
    },
  })

  res.json({
    id: wishlistItemId,
    object: "wishlist_item",
    deleted: true,
  })
}
