import { model } from "@medusajs/framework/utils"
import TicketCategory from "./ticket-category"
import TicketHistory from "./ticket-history"
import TicketMessage from "./ticket-message"

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  WAITING_FOR_CUSTOMER = "waiting_for_customer",
  ANSWERED = "answered",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum TicketPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
}

const Ticket = model
  .define("Ticket", {
    id: model.id({ prefix: "tkt" }).primaryKey(),
    ticket_number: model.text().unique(),
    user_id: model.text().index(),
    category_id: model.text().index(),
    category: model.belongsTo(() => TicketCategory, {
      mappedBy: "tickets",
    }).nullable(),
    order_id: model.text().index().nullable(),
    product_id: model.text().index().nullable(),
    subject: model.text(),
    status: model.enum(TicketStatus).default(TicketStatus.OPEN),
    priority: model.enum(TicketPriority).default(TicketPriority.NORMAL),
    assigned_to: model.text().index().nullable(),
    first_response_at: model.dateTime().nullable(),
    last_message_at: model.dateTime().default(new Date()),
    closed_at: model.dateTime().nullable(),
    messages: model.hasMany(() => TicketMessage, {
      mappedBy: "ticket",
    }),
    history: model.hasMany(() => TicketHistory, {
      mappedBy: "ticket",
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["user_id", "status"],
    },
    {
      on: ["assigned_to", "status"],
    },
    {
      on: ["category_id", "status"],
    },
    {
      on: ["status", "priority"],
    },
  ])

export default Ticket
