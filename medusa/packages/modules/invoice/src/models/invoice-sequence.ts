import { model } from "@medusajs/framework/utils"

const InvoiceSequence = model
  .define("InvoiceSequence", {
    id: model.id({ prefix: "inv_seq" }).primaryKey(),
    name: model.text().default("default"),
    current_value: model.number().default(0),
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default InvoiceSequence
