import { model } from "@medusajs/framework/utils"
import Ticket from "./ticket"
import TicketAttachment from "./ticket-attachment"

export enum SenderType {
  CUSTOMER = "customer",
  USER = "user",
}

const TicketMessage = model.define("TicketMessage", {
  id: model.id({ prefix: "tktmsg" }).primaryKey(),
  ticket_id: model.text().index(),
  ticket: model.belongsTo(() => Ticket, {
    mappedBy: "messages",
  }),
  sender_id: model.text().index(),
  sender_type: model.enum(SenderType).default(SenderType.CUSTOMER),
  message: model.text(),
  is_internal_note: model.boolean().default(false),
  attachments: model.hasMany(() => TicketAttachment, {
    mappedBy: "message",
  }),
  metadata: model.json().nullable(),
})

export default TicketMessage
