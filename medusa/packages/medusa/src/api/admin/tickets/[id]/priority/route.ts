import { updateTicketPriorityWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { enrichTicketWithCustomer, normalizeTicketPriority } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id || req.auth_context?.auth_identity_id || "admin"
  const ticketId = req.params.id
  const body = req.body as any
  const { priority } = body || {}

  if (!priority) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Priority is required"
    )
  }

  const normalizedPriority = normalizeTicketPriority(priority)

  const { result: ticket } = await updateTicketPriorityWorkflow(req.scope).run({
    input: {
      ticket_id: ticketId,
      priority: normalizedPriority,
      actor_id: actorId,
    },
  })

  res.json({ ticket: await enrichTicketWithCustomer(req.scope, ticket) })
}
