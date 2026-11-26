import { addTicketMessageWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { formatTicketMessage, resolveStagedAttachments } from "../../helpers"

async function resolveAdminDisplayName(
  scope: AuthenticatedMedusaRequest["scope"],
  actorId: string
): Promise<string | null> {
  if (!actorId || actorId === "admin") {
    return "Admin"
  }
  try {
    const userService = scope.resolve<any>(Modules.USER)
    const user = await userService?.retrieveUser?.(actorId).catch(() => null)
    if (user) {
      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
      return fullName || user.email || "Admin"
    }
  } catch {
    // Ignore when user module is unavailable in isolated unit tests
  }
  return "Admin"
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId =
    req.auth_context?.actor_id || req.auth_context?.auth_identity_id || "admin"
  const ticketId = req.params.id
  const body = req.body as any
  const {
    message,
    is_internal_note = false,
    attachments = [],
    attachment_ids = [],
  } = body || {}

  if (!message || !String(message).trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Message content is required"
    )
  }

  const stagedAttachments = Array.isArray(attachment_ids) && attachment_ids.length > 0
    ? resolveStagedAttachments(attachment_ids)
    : []

  const allAttachments = [
    ...(Array.isArray(attachments) ? attachments : []),
    ...stagedAttachments,
  ]

  const senderName = await resolveAdminDisplayName(req.scope, actorId)

  const { result: ticketMessage } = await addTicketMessageWorkflow(
    req.scope
  ).run({
    input: {
      ticket_id: ticketId,
      sender_id: actorId,
      sender_type: "user",
      message,
      is_internal_note: !!is_internal_note,
      attachments: allAttachments,
      metadata: {
        sender_name: senderName,
        sender_type: "admin",
      },
    } as any,
  })

  res.status(201).json({
    message: formatTicketMessage({
      ...ticketMessage,
      sender_id: ticketMessage?.sender_id ?? actorId,
      sender_name: ticketMessage?.sender_name ?? senderName,
    }),
  })
}
