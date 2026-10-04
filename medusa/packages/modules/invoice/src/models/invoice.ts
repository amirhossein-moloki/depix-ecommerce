import { model } from "@medusajs/framework/utils"
import InvoiceItem from "./invoice-item"

export enum InvoiceStatus {
  ISSUED = "issued",
  PAID = "paid",
  CANCELLED = "cancelled",
}

const Invoice = model
  .define("Invoice", {
    id: model.id({ prefix: "inv" }).primaryKey(),
    display_id: model.autoincrement(),
    invoice_number: model.text(),
    order_id: model.text(),
    customer_id: model.text().nullable(),
    status: model.enum(InvoiceStatus).default(InvoiceStatus.ISSUED),
    currency_code: model.text(),
    issue_date: model.dateTime(),
    due_date: model.dateTime().nullable(),
    subtotal: model.number(),
    discount_total: model.number().default(0),
    tax_total: model.number().default(0),
    shipping_total: model.number().default(0),
    total: model.number(),
    seller_details: model.json().nullable(),
    billing_address: model.json().nullable(),
    shipping_address: model.json().nullable(),
    file_id: model.text().nullable(),
    file_url: model.text().nullable(),
    metadata: model.json().nullable(),
    items: model.hasMany(() => InvoiceItem, {
      mappedBy: "invoice",
    }),
  })
  .indexes([
    {
      on: ["invoice_number"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["order_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["customer_id"],
    },
    {
      on: ["status"],
    },
  ])

export default Invoice
