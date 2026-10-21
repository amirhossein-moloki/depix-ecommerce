import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

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
      order: { "messages.created_at": "ASC" },
    }
  )

  if (!ticket || ticket.user_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Ticket with id ${ticketId} was not found`
    )
  }

  // Filter out internal notes completely for customer view
  const safeMessages = (ticket.messages || [])
    .filter((msg: any) => !msg.is_internal_note)
    .map((msg: any) => ({
      id: msg.id,
      ticket_id: msg.ticket_id,
      sender_id: msg.sender_id,
      sender_type: msg.sender_type,
      message: msg.message,
      attachments: msg.attachments || [],
      created_at: msg.created_at,
    }))

  const sanitizedTicket = {
    ...ticket,
    messages: safeMessages,
  }

  res.json({ ticket: sanitizedTicket })
}
