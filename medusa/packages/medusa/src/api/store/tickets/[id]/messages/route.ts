import { addTicketMessageWorkflow } from "@medusajs/core-flows"
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
      "Authentication required to view ticket messages"
    )
  }

  const ticketId = req.params.id
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const [ticket] = await ticketService.listTickets(
    { id: ticketId },
    { take: 1 }
  )

  if (!ticket || ticket.user_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Ticket with id ${ticketId} was not found`
    )
  }

  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100)
  const offset = parseInt((req.query.offset as string) || "0", 10)

  const [messages, count] = await ticketService.listAndCountTicketMessages(
    {
      ticket_id: ticketId,
      is_internal_note: false,
    },
    {
      skip: offset,
      take: limit,
      order: { created_at: "ASC" },
      relations: ["attachments"],
    }
  )

  res.json({
    messages,
    count,
    offset,
    limit,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to send message"
    )
  }

  const ticketId = req.params.id
  const body = req.body as any
  const { message, attachments } = body || {}

  const { result: ticketMessage } = await addTicketMessageWorkflow(
    req.scope
  ).run({
    input: {
      ticket_id: ticketId,
      sender_id: customerId,
      sender_type: "customer",
      message,
      is_internal_note: false,
      attachments: attachments || [],
    },
  })

  res.status(201).json({ message: ticketMessage })
}
