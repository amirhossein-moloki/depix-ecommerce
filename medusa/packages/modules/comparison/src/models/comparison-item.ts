import { model } from "@medusajs/framework/utils"
import Comparison from "./comparison"

const ComparisonItem = model
  .define("ComparisonItem", {
    id: model.id({ prefix: "compi" }).primaryKey(),
    product_id: model.text(),
    comparison: model.belongsTo(() => Comparison, {
      mappedBy: "items",
    }),
  })
  .indexes([
    {
      on: ["product_id"],
    },
  ])

export default ComparisonItem
