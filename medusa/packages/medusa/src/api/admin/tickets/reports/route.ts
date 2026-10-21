import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const tickets = await ticketService.listTickets(
    {},
    {
      relations: ["category"],
      take: 10000,
    }
  )

  const total_tickets = tickets.length
  const by_status: Record<string, number> = {
    open: 0,
    in_progress: 0,
    waiting_for_customer: 0,
    answered: 0,
    resolved: 0,
    closed: 0,
  }

  const by_priority: Record<string, number> = {
    low: 0,
    normal: 0,
    high: 0,
  }

  const by_category: Record<string, number> = {}

  let totalResponseTimeMs = 0
  let responseTimeCount = 0

  for (const t of tickets) {
    if (t.status && by_status[t.status] !== undefined) {
      by_status[t.status]++
    } else if (t.status) {
      by_status[t.status] = 1
    }

    if (t.priority && by_priority[t.priority] !== undefined) {
      by_priority[t.priority]++
    }

    const catName = t.category?.name || "Uncategorized"
    by_category[catName] = (by_category[catName] || 0) + 1

    if (t.first_response_at && t.created_at) {
      const start = new Date(t.created_at).getTime()
      const end = new Date(t.first_response_at).getTime()
      if (end >= start) {
        totalResponseTimeMs += end - start
        responseTimeCount++
      }
    }
  }

  const avg_first_response_time_minutes =
    responseTimeCount > 0
      ? Math.round(totalResponseTimeMs / (responseTimeCount * 60 * 1000))
      : 0

  res.json({
    reports: {
      total_tickets,
      by_status,
      by_priority,
      by_category,
      avg_first_response_time_minutes,
    },
  })
}
