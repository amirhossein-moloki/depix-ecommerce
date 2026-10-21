import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  deleteFileFromLocalStorage,
  saveFileToLocalStorage,
  validateAndPrepareUpload,
} from "@medusajs/media"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const reqFiles = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[]
    | undefined

  let filesList: Express.Multer.File[] = []

  if (Array.isArray(reqFiles)) {
    filesList = reqFiles
  } else if (reqFiles && typeof reqFiles === "object") {
    if (reqFiles["file"]) filesList.push(...reqFiles["file"])
    if (reqFiles["files"]) filesList.push(...reqFiles["files"])
  }

  if (!filesList.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No file was provided for review attachment upload."
    )
  }

  const mediaService = req.scope.resolve(Modules.MEDIA)
  const customerId = req.auth_context?.actor_id || null

  const attachments = []

  for (const file of filesList) {
    // 5MB limit for review attachments
    const { originalFilename, fileKey, mimeType, fileSize, dimensions } =
      validateAndPrepareUpload(file, 5 * 1024 * 1024)

    if (!mimeType.startsWith("image/")) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Review attachments must be image files."
      )
    }

    const { url } = await saveFileToLocalStorage(fileKey, file.buffer)

    try {
      const media = await mediaService.createMedia({
        original_filename: originalFilename,
        file_key: fileKey,
        mime_type: mimeType,
        file_size: fileSize,
        storage_provider: "local",
        url,
        width: dimensions.width,
        height: dimensions.height,
        uploaded_by_id: customerId,
        metadata: { purpose: "review_attachment" },
      })
      attachments.push({
        media_id: media.id,
        url: media.url,
        original_filename: media.original_filename,
      })
    } catch (dbErr) {
      await deleteFileFromLocalStorage(fileKey)
      throw dbErr
    }
  }

  res.status(201).json({
    media_id: attachments[0].media_id,
    url: attachments[0].url,
    attachments,
  })
}
