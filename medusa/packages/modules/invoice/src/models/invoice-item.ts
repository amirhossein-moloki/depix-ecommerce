import { model } from "@medusajs/framework/utils"
import Invoice from "./invoice"

const InvoiceItem = model
  .define("InvoiceItem", {
    id: model.id({ prefix: "inv_item" }).primaryKey(),
    invoice: model.belongsTo(() => Invoice, {
      mappedBy: "items",
    }),
    item_id: model.text().nullable(),
    title: model.text(),
    subtitle: model.text().nullable(),
    product_id: model.text().nullable(),
    variant_id: model.text().nullable(),
    quantity: model.number(),
    unit_price: model.number(),
    subtotal: model.number(),
    tax_total: model.number().default(0),
    discount_total: model.number().default(0),
    total: model.number(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["item_id"],
    },
    {
      on: ["product_id"],
    },
  ])

export default InvoiceItem
