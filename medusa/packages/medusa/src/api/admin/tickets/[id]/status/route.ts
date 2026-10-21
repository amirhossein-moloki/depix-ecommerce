import { updateTicketStatusWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id || req.auth_context?.auth_identity_id || "admin"
  const ticketId = req.params.id
  const body = req.body as any
  const { status } = body || {}

  if (!status) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Status is required"
    )
  }

  const { result: ticket } = await updateTicketStatusWorkflow(req.scope).run({
    input: {
      ticket_id: ticketId,
      status,
      actor_id: actorId,
    },
  })

  res.json({ ticket })
}
