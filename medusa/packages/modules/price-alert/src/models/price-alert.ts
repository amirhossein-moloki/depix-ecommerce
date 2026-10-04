import { model } from "@medusajs/framework/utils"

export const PriceAlertStatus = {
  ACTIVE: "active",
  NOTIFIED: "notified",
  CANCELLED: "cancelled",
  FAILED: "failed",
} as const

export type PriceAlertStatusType =
  (typeof PriceAlertStatus)[keyof typeof PriceAlertStatus]

export const PriceAlertType = {
  ANY_CHANGE: "any_change",
  PRICE_DROP: "price_drop",
  TARGET_PRICE: "target_price",
} as const

export type PriceAlertTypeKind =
  (typeof PriceAlertType)[keyof typeof PriceAlertType]

const PriceAlert = model
  .define("PriceAlert", {
    id: model.id({ prefix: "pal" }).primaryKey(),
    customer_id: model.text(),
    product_id: model.text(),
    variant_id: model.text(),
    currency_code: model.text(),
    region_id: model.text().nullable(),
    alert_type: model.text().default(PriceAlertType.PRICE_DROP),
    reference_price: model.bigNumber(),
    target_price: model.bigNumber().nullable(),
    channel: model.text().default("in-app"),
    status: model.text().default(PriceAlertStatus.ACTIVE),
    notified_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["customer_id"],
    },
    {
      on: ["product_id"],
    },
    {
      on: ["variant_id"],
    },
    {
      on: ["currency_code"],
    },
    {
      on: ["status"],
    },
    {
      on: ["channel"],
    },
    {
      on: ["created_at"],
    },
    {
      on: ["variant_id", "currency_code", "status"],
    },
    {
      on: ["customer_id", "status"],
    },
  ])

export default PriceAlert
