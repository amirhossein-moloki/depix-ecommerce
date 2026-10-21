import { model } from "@medusajs/framework/utils"
import TicketMessage from "./ticket-message"

const TicketAttachment = model.define("TicketAttachment", {
  id: model.id({ prefix: "tktatt" }).primaryKey(),
  message_id: model.text().index(),
  message: model.belongsTo(() => TicketMessage, {
    mappedBy: "attachments",
  }),
  original_filename: model.text(),
  storage_path: model.text(),
  mime_type: model.text(),
  file_size: model.number(),
  metadata: model.json().nullable(),
})

export default TicketAttachment
