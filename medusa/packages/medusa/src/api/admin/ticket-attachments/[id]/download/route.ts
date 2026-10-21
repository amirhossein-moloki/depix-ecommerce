import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import * as fs from "fs"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const attachmentId = req.params.id
  const ticketService = req.scope.resolve(Modules.TICKET) as any

  const [attachment] = await ticketService.listTicketAttachments(
    { id: attachmentId },
    {
      relations: ["message", "message.ticket"],
      take: 1,
    }
  )

  if (!attachment) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attachment with id ${attachmentId} was not found`
    )
  }

  const filePath = attachment.storage_path
  if (fs.existsSync(filePath)) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.original_filename)}"`
    )
    res.setHeader("Content-Type", attachment.mime_type)
    return fs.createReadStream(filePath).pipe(res)
  }

  res.json({
    id: attachment.id,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    file_size: attachment.file_size,
    storage_path: attachment.storage_path,
  })
}
