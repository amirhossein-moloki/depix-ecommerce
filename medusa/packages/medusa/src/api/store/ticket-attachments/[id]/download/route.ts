import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id
  if (!actorId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to download attachment"
    )
  }

  const attachmentId = req.params.id
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const [attachment] = await ticketService.listTicketAttachments(
    { id: attachmentId },
    {
      relations: ["message", "message.ticket"],
      take: 1,
    }
  )

  if (!attachment || !attachment.message || !attachment.message.ticket) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attachment with id ${attachmentId} was not found`
    )
  }

  const ticket = attachment.message.ticket
  const isCustomer = req.auth_context.actor_type === "customer" || !req.auth_context.actor_type

  // If customer request, enforce ticket ownership
  if (isCustomer && ticket.user_id !== actorId) {
    throw new MedusaError(
      MedusaError.Types.FORBIDDEN,
      "You are not authorized to download this attachment"
    )
  }

  // Check file exists on filesystem if storage_path is local
  const filePath = attachment.storage_path
  if (fs.existsSync(filePath)) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.original_filename)}"`
    )
    res.setHeader("Content-Type", attachment.mime_type)
    return fs.createReadStream(filePath).pipe(res)
  }

  // Return download metadata response if file is stored externally or as mock
  res.json({
    id: attachment.id,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    file_size: attachment.file_size,
    storage_path: attachment.storage_path,
  })
}
