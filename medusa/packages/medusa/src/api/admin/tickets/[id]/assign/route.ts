import { assignTicketWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id || req.auth_context?.auth_identity_id || "admin"
  const ticketId = req.params.id
  const body = req.body as any
  const { assigned_to } = body || {}

  const { result: ticket } = await assignTicketWorkflow(req.scope).run({
    input: {
      ticket_id: ticketId,
      assigned_to: assigned_to || null,
      actor_id: actorId,
    },
  })

  res.json({ ticket })
}
