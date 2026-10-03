import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStockAlertWorkflow } from "@medusajs/core-flows"
import {
  StoreCreateStockAlertType,
  StoreGetStockAlertsParamsType,
} from "./validators"

export const POST = async (
  req: MedusaRequest<StoreCreateStockAlertType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to create stock alert"
    )
  }

  const { product_id, variant_id, channel } = req.validatedBody

  const { result } = await createStockAlertWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
      variant_id,
      channel,
    },
  })

  res.status(200).json({ stock_alert: result })
}

export const GET = async (
  req: MedusaRequest<StoreGetStockAlertsParamsType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to access stock alerts"
    )
  }

  const stockAlertService = req.scope.resolve<any>(Modules.STOCK_ALERT)
  const { limit = 20, offset = 0, status, product_id, variant_id } =
    req.validatedQuery || {}

  const filters: Record<string, any> = {
    customer_id: customerId,
  }

  if (status) {
    filters.status = status
  }
  if (product_id) {
    filters.product_id = product_id
  }
  if (variant_id) {
    filters.variant_id = variant_id
  }

  const [stockAlerts, count] = await stockAlertService.listAndCountStockAlerts(
    filters,
    {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    stock_alerts: stockAlerts,
    count,
    limit,
    offset,
  })
}
