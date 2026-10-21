import { MedusaService } from "@medusajs/framework/utils"
import TicketCategory from "../models/ticket-category"
import Ticket from "../models/ticket"
import TicketMessage from "../models/ticket-message"
import TicketAttachment from "../models/ticket-attachment"
import TicketHistory from "../models/ticket-history"

class TicketModuleService extends MedusaService({
  TicketCategory,
  Ticket,
  TicketMessage,
  TicketAttachment,
  TicketHistory,
}) {
  /**
   * Generates a public unique ticket number server-side format: TKT-YYYY-XXXXXX
   * Example: TKT-2026-000123
   */
  async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear()
    let isUnique = false
    let ticketNumber = ""
    let attempts = 0

    while (!isUnique && attempts < 10) {
      attempts++
      const randomSeq = Math.floor(100000 + Math.random() * 900000)
      ticketNumber = `TKT-${year}-${randomSeq}`

      const existing = await (this as any).listTickets(
        { ticket_number: ticketNumber },
        { take: 1 }
      )

      if (!existing || existing.length === 0) {
        isUnique = true
      }
    }

    if (!isUnique) {
      ticketNumber = `TKT-${year}-${Date.now().toString().slice(-6)}`
    }

    return ticketNumber
  }
}

export default TicketModuleService
