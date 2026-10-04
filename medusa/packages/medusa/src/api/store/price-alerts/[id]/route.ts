import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { cancelPriceAlertWorkflow } from "@medusajs/core-flows"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to access price alert"
    )
  }

  const { id } = req.params
  const priceAlertService = req.scope.resolve<any>(Modules.PRICE_ALERT)

  let alert: any
  try {
    alert = await priceAlertService.retrievePriceAlert(id)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Price alert with id ${id} not found`
    )
  }

  if (alert.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You are not allowed to access this price alert"
    )
  }

  res.json({
    object: "price_alert",
    price_alert: alert,
  })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to cancel price alert"
    )
  }

  const { id } = req.params

  const { result } = await cancelPriceAlertWorkflow(req.scope).run({
    input: {
      id,
      customer_id: customerId,
    },
  })

  res.json({
    object: "price_alert",
    price_alert: result,
  })
}
