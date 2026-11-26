import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ticketId = req.params.id
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const [ticket] = await ticketService.listTickets(
    { id: ticketId },
    {
      relations: [
        "category",
        "messages",
        "messages.attachments",
        "history",
      ],
    }
  )

  if (!ticket) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Ticket with id ${ticketId} was not found`
    )
  }

  const byCreatedAtAsc = (a: any, b: any) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  const sortedMessages = [...(ticket.messages || [])].sort(byCreatedAtAsc)
  const sortedHistory = [...(ticket.history || [])].sort(byCreatedAtAsc)

  // Fetch optional order info
  let orderInfo = null
  if (ticket.order_id) {
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "display_id", "status", "total", "currency_code"],
        filters: { id: ticket.order_id },
      })
      orderInfo = orders && orders[0] ? orders[0] : null
    } catch {
      orderInfo = null
    }
  }

  res.json({
    ticket: {
      ...ticket,
      messages: sortedMessages,
      history: sortedHistory,
      order: orderInfo,
    },
  })
}
