import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const priceAlertService = req.scope.resolve<any>(Modules.PRICE_ALERT)
  const {
    limit = 20,
    offset = 0,
    customer_id,
    product_id,
    variant_id,
    status,
    currency_code,
  } = req.filterableFields || {}

  const filters: Record<string, any> = {}

  if (customer_id) filters.customer_id = customer_id
  if (product_id) filters.product_id = product_id
  if (variant_id) filters.variant_id = variant_id
  if (status) filters.status = status
  if (currency_code) filters.currency_code = currency_code.toLowerCase()

  const [priceAlerts, count] = await priceAlertService.listAndCountPriceAlerts(
    filters,
    {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    }
  )

  res.json({
    price_alerts: priceAlerts,
    count,
    limit: Number(limit),
    offset: Number(offset),
  })
}
