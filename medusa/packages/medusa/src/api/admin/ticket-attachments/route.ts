import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { stageTicketAttachment } from "../tickets/helpers"

/**
 * @oas [post] /admin/ticket-attachments
 * operationId: "AdminUploadTicketAttachment"
 * summary: "Upload Ticket Attachment"
 * description: "Uploads a file attachment for a support ticket message and returns an attachment_id to pass in attachment_ids."
 * x-authenticated: true
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const file = (req as any).file
  if (!file || !file.buffer) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Attachment file is required (multipart/form-data field 'file')"
    )
  }

  const staged = stageTicketAttachment({
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  })

  res.status(201).json({
    attachment_id: staged.attachment_id,
    original_filename: staged.original_filename,
    mime_type: staged.mime_type,
    file_size: staged.file_size,
  })
}
