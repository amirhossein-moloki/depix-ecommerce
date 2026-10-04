import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createPriceAlertWorkflow } from "@medusajs/core-flows"
import { StoreCreatePriceAlertType } from "../../price-alerts/validators"

export const POST = async (
  req: MedusaRequest<StoreCreatePriceAlertType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to create price alert"
    )
  }

  const { id: productId } = req.params
  const {
    variant_id,
    currency_code,
    region_id,
    alert_type,
    reference_price,
    target_price,
    channel,
    metadata,
  } = req.validatedBody

  const { result } = await createPriceAlertWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id: productId,
      variant_id,
      currency_code,
      region_id,
      alert_type,
      reference_price,
      target_price,
      channel,
      metadata,
    },
  })

  res.status(200).json({ price_alert: result })
}
