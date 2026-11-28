import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  enrichTicketWithCustomer,
  formatTicketMessage,
} from "../../../admin/tickets/helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to view ticket"
    )
  }

  const ticketId = req.params.id
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const [ticket] = await ticketService.listTickets(
    { id: ticketId },
    {
      relations: ["category", "messages", "messages.attachments"],
    }
  )

  if (!ticket || ticket.user_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Ticket with id ${ticketId} was not found`
    )
  }

  // Filter out internal notes completely for customer view and sort chronologically
  const safeMessages = (ticket.messages || [])
    .filter((msg: any) => !msg.is_internal_note)
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((msg: any) =>
      formatTicketMessage({
        id: msg.id,
        ticket_id: msg.ticket_id,
        sender_id: msg.sender_id,
        sender_type: msg.sender_type,
        sender_name: msg.sender_name,
        metadata: msg.metadata,
        message: msg.message,
        is_internal_note: msg.is_internal_note,
        attachments: msg.attachments || [],
        created_at: msg.created_at,
      })
    )

  const enrichedTicket = await enrichTicketWithCustomer(req.scope, ticket)

  const sanitizedTicket = {
    ...enrichedTicket,
    messages: safeMessages,
  }

  res.json({ ticket: sanitizedTicket })
}
