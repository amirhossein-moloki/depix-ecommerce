import { updateCartPromotionsWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { Modules, PromotionActions } from "@medusajs/framework/utils"
import { refetchCart } from "../../../helpers"

export const DELETE = async (
  req: MedusaRequest<{}, HttpTypes.SelectParams>,
  res: MedusaResponse<{
    cart: HttpTypes.StoreCart
  }>
) => {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const code = decodeURIComponent(req.params.code)

  await we.run(updateCartPromotionsWorkflowId, {
    input: {
      promo_codes: [code],
      cart_id: req.params.id,
      action: PromotionActions.REMOVE,
      force_refresh_payment_collection: true,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
