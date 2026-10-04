import { model } from "@medusajs/framework/utils"

const ProductRelationship = model
  .define("ProductRelationship", {
    id: model.id({ prefix: "prrel" }).primaryKey(),
    source_product_id: model.text(),
    related_product_id: model.text(),
    relationship_type: model.text().default("RELATED"),
    priority: model.number().default(0),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["source_product_id"],
    },
    {
      on: ["related_product_id"],
    },
    {
      on: ["relationship_type"],
    },
    {
      on: ["is_active"],
    },
  ])

export default ProductRelationship
