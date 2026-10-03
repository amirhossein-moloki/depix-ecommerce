import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminGetStockAlertsParamsType } from "./validators"

export const GET = async (
  req: MedusaRequest<AdminGetStockAlertsParamsType>,
  res: MedusaResponse
) => {
  const stockAlertService = req.scope.resolve<any>(Modules.STOCK_ALERT)
  const {
    limit = 20,
    offset = 0,
    customer_id,
    product_id,
    variant_id,
    status,
    channel,
  } = req.validatedQuery || {}

  const filters: Record<string, any> = {}

  if (customer_id) {
    filters.customer_id = customer_id
  }
  if (product_id) {
    filters.product_id = product_id
  }
  if (variant_id) {
    filters.variant_id = variant_id
  }
  if (status) {
    filters.status = status
  }
  if (channel) {
    filters.channel = channel
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
