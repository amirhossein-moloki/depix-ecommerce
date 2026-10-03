import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { cancelStockAlertWorkflow } from "@medusajs/core-flows"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to cancel stock alert"
    )
  }

  const alertId = req.params.id

  const { result } = await cancelStockAlertWorkflow(req.scope).run({
    input: {
      id: alertId,
      customer_id: customerId,
    },
  })

  res.json({
    id: alertId,
    object: "stock_alert",
    deleted: true,
    stock_alert: result,
  })
}
