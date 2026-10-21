import { model } from "@medusajs/framework/utils"

const TicketCategory = model.define("TicketCategory", {
  id: model.id({ prefix: "tktcat" }).primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),
  metadata: model.json().nullable(),
}).indexes([
  {
    on: ["is_active", "sort_order"],
  },
])

export default TicketCategory
