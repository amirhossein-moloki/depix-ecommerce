import { addTicketMessageWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id || req.auth_context?.auth_identity_id || "admin"
  const ticketId = req.params.id
  const body = req.body as any
  const { message, is_internal_note = false, attachments } = body || {}

  if (!message || !message.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Message content is required"
    )
  }

  const { result: ticketMessage } = await addTicketMessageWorkflow(
    req.scope
  ).run({
    input: {
      ticket_id: ticketId,
      sender_id: actorId,
      sender_type: "user",
      message,
      is_internal_note: !!is_internal_note,
      attachments: attachments || [],
    },
  })

  res.status(201).json({ message: ticketMessage })
}
