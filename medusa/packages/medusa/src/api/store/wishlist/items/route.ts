import {
  clearWishlistWorkflow,
  createWishlistItemWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { StoreCreateWishlistItemType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateWishlistItemType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to modify wishlist"
    )
  }

  const { product_id, variant_id } = req.validatedBody

  const { result: item } = await createWishlistItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
      variant_id,
    },
  })

  res.status(201).json({ item })
}

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

  await clearWishlistWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
    },
  })

  res.json({
    success: true,
    object: "wishlist",
    deleted: true,
  })
}
