import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100)
  const offset = parseInt((req.query.offset as string) || "0", 10)
  const status = req.query.status as string
  const category_id = req.query.category_id as string
  const priority = req.query.priority as string
  const assigned_to = req.query.assigned_to as string
  const user_id = req.query.user_id as string
  const q = req.query.q as string

  const filters: Record<string, any> = {}

  if (status) filters.status = status
  if (category_id) filters.category_id = category_id
  if (priority) filters.priority = priority
  if (assigned_to) filters.assigned_to = assigned_to
  if (user_id) filters.user_id = user_id

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
