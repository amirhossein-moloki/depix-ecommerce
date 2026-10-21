import { updateTicketStatusWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id || req.auth_context?.auth_identity_id || "admin"
  const ticketId = req.params.id

  const { result: ticket } = await updateTicketStatusWorkflow(req.scope).run({
    input: {
      ticket_id: ticketId,
      status: "open",
      actor_id: actorId,
    },
  })

  res.json({ ticket })
}
