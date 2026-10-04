import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createPriceAlertWorkflow } from "@medusajs/core-flows"
import {
  StoreCreatePriceAlertType,
  StoreGetPriceAlertsParamsType,
} from "./validators"

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

  const {
    product_id,
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
      product_id,
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

export const GET = async (
  req: MedusaRequest<StoreGetPriceAlertsParamsType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to access price alerts"
    )
  }

  const priceAlertService = req.scope.resolve<any>(Modules.PRICE_ALERT)
  const { limit = 20, offset = 0, status, product_id, variant_id, currency_code } =
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
  if (currency_code) {
    filters.currency_code = currency_code.toLowerCase()
  }

  const [priceAlerts, count] = await priceAlertService.listAndCountPriceAlerts(
    filters,
    {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    price_alerts: priceAlerts,
    count,
    limit,
    offset,
  })
}
