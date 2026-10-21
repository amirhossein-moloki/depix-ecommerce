import { model } from "@medusajs/framework/utils"
import Ticket from "./ticket"

const TicketHistory = model.define("TicketHistory", {
  id: model.id({ prefix: "tkthist" }).primaryKey(),
  ticket_id: model.text().index(),
  ticket: model.belongsTo(() => Ticket, {
    mappedBy: "history",
  }),
  actor_id: model.text(),
  action: model.text(),
  old_value: model.text().nullable(),
  new_value: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default TicketHistory
