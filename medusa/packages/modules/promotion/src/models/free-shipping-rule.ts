import { model } from "@medusajs/framework/utils"

const FreeShippingRule = model
  .define(
    { name: "FreeShippingRule", tableName: "promotion_free_shipping_rule" },
    {
      id: model.id({ prefix: "fsr" }).primaryKey(),
      title: model.text().searchable(),
      scope: model
        .enum(["store", "products", "categories", "campaign"])
        .default("store"),
      product_ids: model.json().nullable(),
      category_ids: model.json().nullable(),
      campaign_id: model.text().nullable(),
      min_purchase_amount: model.bigNumber().nullable(),
      starts_at: model.dateTime().nullable(),
      ends_at: model.dateTime().nullable(),
      is_active: model.boolean().default(true),
      metadata: model.json().nullable(),
    }
  )
  .indexes([
    {
      name: "IDX_free_shipping_rule_is_active",
      on: ["is_active"],
    },
    {
      name: "IDX_free_shipping_rule_scope",
      on: ["scope"],
    },
  ])

export default FreeShippingRule
