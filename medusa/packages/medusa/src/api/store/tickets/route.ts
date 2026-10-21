import { createTicketWorkflow } from "@medusajs/core-flows"
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
      "Authentication required to view tickets"
    )
  }

  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100)
  const offset = parseInt((req.query.offset as string) || "0", 10)
  const status = req.query.status as string
  const category_id = req.query.category_id as string
  const q = req.query.q as string

  const filters: Record<string, any> = {
    user_id: customerId,
  }

  if (status) {
    filters.status = status
  }
  if (category_id) {
    filters.category_id = category_id
  }
  if (q && q.trim()) {
    const searchTerm = q.trim()
    filters.$or = [
      { ticket_number: { $ilike: `%${searchTerm}%` } },
      { subject: { $ilike: `%${searchTerm}%` } },
    ]
  }

  const [tickets, count] = await ticketService.listAndCountTickets(filters, {
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
    relations: ["category"],
  })

  res.json({
    tickets,
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
      "Authentication required to create a ticket"
    )
  }

  const body = req.body as any
  const {
    category_id,
    subject,
    message,
    order_id,
    product_id,
    priority,
    attachments,
  } = body || {}

  const { result: ticket } = await createTicketWorkflow(req.scope).run({
    input: {
      user_id: customerId,
      category_id,
      subject,
      message,
      order_id: order_id || null,
      product_id: product_id || null,
      priority: priority || "normal",
      attachments: attachments || [],
    },
  })

  res.status(201).json({ ticket })
}
