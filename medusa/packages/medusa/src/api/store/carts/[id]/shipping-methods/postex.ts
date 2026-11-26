import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { StoreSettingsService } from "../../../../admin/settings/services/store-settings-service"

export const DEFAULT_POSTEX_QUOTES_URL =
  "https://api.postex.ir/api/v1/shipping/quotes"
export const DEFAULT_TABRIZ_CITY_CODE = 128
export const DEFAULT_ITEM_WEIGHT_GRAMS = 500
export const TABRIZ_COURIER_NOTE =
  "هزینه ارسال متغیر - پرداخت در محل توسط مشتری"

export interface PostexQuoteParams {
  fromCityCode?: number
  toCityCode: number
  totalWeightGrams: number
  totalValueIrr: number
  courierCode?: string
  boxSizeId?: number
}

/**
 * Resolves the origin city code from the store's default shipping address (postexCityCode),
 * falling back to POSTEX_ORIGIN_CITY_CODE or DEFAULT_TABRIZ_CITY_CODE.
 */
export async function resolveOriginPostexCityCode(
  scope: MedusaContainer
): Promise<number> {
  try {
    const settingsService = new StoreSettingsService(scope)
    const snapshot = await settingsService.getShippingAddressSnapshot()
    const code = Number(snapshot?.postexCityCode ?? snapshot?.postex_city_code)
    if (Number.isFinite(code) && code > 0) {
      return code
    }
  } catch {
    // Store module may be absent in isolated unit tests
  }

  const envCode = Number(
    process.env.POSTEX_ORIGIN_CITY_CODE || DEFAULT_TABRIZ_CITY_CODE
  )
  return Number.isFinite(envCode) && envCode > 0
    ? envCode
    : DEFAULT_TABRIZ_CITY_CODE
}

/**
 * Computes total parcel weight (in grams) and declared value (in IRR) from cart items.
 */
export function computeCartWeightAndValue(cart: any): {
  totalWeightGrams: number
  totalValueIrr: number
} {
  const items = Array.isArray(cart?.items) ? cart.items : []
  let totalWeight = 0
  let totalValue = 0

  for (const item of items) {
    const qty = Math.max(1, Number(item?.quantity ?? 1))
    const unitWeight = Number(
      item?.variant?.weight ?? item?.product?.weight ?? DEFAULT_ITEM_WEIGHT_GRAMS
    )
    const unitPrice = Number(item?.unit_price ?? 0)

    totalWeight += (Number.isFinite(unitWeight) && unitWeight > 0 ? unitWeight : DEFAULT_ITEM_WEIGHT_GRAMS) * qty
    totalValue += (Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0) * qty
  }

  if (totalValue <= 0) {
    totalValue = Math.max(0, Number(cart?.item_subtotal ?? cart?.subtotal ?? 0))
  }

  return {
    totalWeightGrams: Math.max(100, Math.round(totalWeight || DEFAULT_ITEM_WEIGHT_GRAMS)),
    totalValueIrr: Math.round(totalValue),
  }
}

function extractPostexPriceIrr(payload: any): number | null {
  const candidates: unknown[] = []

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      candidates.push(entry?.total_price, entry?.price, entry?.amount)
    }
  } else if (payload && typeof payload === "object") {
    if (Array.isArray(payload.shipping_prices)) {
      for (const entry of payload.shipping_prices) {
        candidates.push(entry?.total_price, entry?.price, entry?.amount)
      }
    }
    if (Array.isArray(payload.data)) {
      for (const entry of payload.data) {
        candidates.push(entry?.total_price, entry?.price, entry?.amount)
      }
    }
    candidates.push(
      payload.total_price,
      payload.price,
      payload.amount,
      payload.data?.total_price,
      payload.data?.price,
      payload.data?.amount
    )
  }

  for (const raw of candidates) {
    if (raw !== undefined && raw !== null) {
      const num = Number(raw)
      if (Number.isFinite(num) && num >= 0) {
        return Math.round(num)
      }
    }
  }

  return null
}

/**
 * Fetches a live shipping quote in IRR from the Postex API.
 */
export async function fetchPostexQuoteIrr({
  fromCityCode,
  toCityCode,
  totalWeightGrams,
  totalValueIrr,
  courierCode = "IR_POST",
  boxSizeId = 1,
}: PostexQuoteParams): Promise<number> {
  const apiUrl = process.env.POSTEX_API_URL || DEFAULT_POSTEX_QUOTES_URL
  const apiKey = process.env.POSTEX_API_KEY
  const resolvedFromCityCode =
    fromCityCode !== undefined && Number.isFinite(fromCityCode) && fromCityCode > 0
      ? fromCityCode
      : Number(process.env.POSTEX_ORIGIN_CITY_CODE || DEFAULT_TABRIZ_CITY_CODE)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (apiKey) {
    headers["x-api-key"] = apiKey
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from_city_code: Number.isFinite(resolvedFromCityCode)
        ? resolvedFromCityCode
        : DEFAULT_TABRIZ_CITY_CODE,
      to_city_code: toCityCode,
      parcels: [
        {
          total_weight: totalWeightGrams,
          total_value: totalValueIrr,
          box_size_id: boxSizeId,
        },
      ],
      courier: {
        courier_code: courierCode,
      },
    }),
  })

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `خطا در استعلام نرخ ارسال از پستکس (کد وضعیت: ${response.status}).`
    )
  }

  const payload = await response.json().catch(() => null)
  const priceIrr = extractPostexPriceIrr(payload)

  if (priceIrr === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "پاسخ نامعتبر از سرویس محاسبه نرخ پستکس دریافت شد."
    )
  }

  return priceIrr
}
