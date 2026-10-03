import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createStockAlertWorkflow } from "@medusajs/core-flows"
import { StoreCreateProductStockAlertType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreCreateProductStockAlertType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to create stock alert"
    )
  }

  const productId = req.params.id
  const { variant_id, channel } = req.validatedBody

  const { result } = await createStockAlertWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id: productId,
      variant_id,
      channel,
    },
  })

  res.status(200).json({ stock_alert: result })
}
