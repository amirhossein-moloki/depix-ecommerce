import { model } from "@medusajs/framework/utils"

export const StockAlertStatus = {
  ACTIVE: "active",
  NOTIFIED: "notified",
  CANCELLED: "cancelled",
  FAILED: "failed",
} as const

export type StockAlertStatusType =
  (typeof StockAlertStatus)[keyof typeof StockAlertStatus]

const StockAlert = model
  .define("StockAlert", {
    id: model.id({ prefix: "sta" }).primaryKey(),
    customer_id: model.text(),
    product_id: model.text(),
    variant_id: model.text(),
    channel: model.text().default("sms"),
    status: model.text().default(StockAlertStatus.ACTIVE),
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
      on: ["status"],
    },
    {
      on: ["channel"],
    },
    {
      on: ["created_at"],
    },
    {
      on: ["product_id", "variant_id", "status"],
    },
    {
      on: ["customer_id", "status"],
    },
  ])

export default StockAlert
