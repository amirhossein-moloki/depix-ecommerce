import { model } from "@medusajs/framework/utils"
import ComparisonItem from "./comparison-item"

const Comparison = model
  .define("Comparison", {
    id: model.id({ prefix: "comp" }).primaryKey(),
    customer_id: model.text().nullable(),
    items: model.hasMany(() => ComparisonItem, {
      mappedBy: "comparison",
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["customer_id"],
    },
  ])

export default Comparison
