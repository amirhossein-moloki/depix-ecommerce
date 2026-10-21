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
      "No file was provided for upload."
    )
  }

  const mediaService = req.scope.resolve(Modules.MEDIA)
  const uploaderId =
    req.auth_context?.actor_id || (req as any).user?.id || null

  const createdMediaItems = []

  for (const file of filesList) {
    const { originalFilename, fileKey, mimeType, fileSize, dimensions } =
      validateAndPrepareUpload(file)

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
        uploaded_by_id: uploaderId,
      })
      createdMediaItems.push(media)
    } catch (dbErr) {
      // Rollback file on disk if DB save fails
      await deleteFileFromLocalStorage(fileKey)
      throw dbErr
    }
  }

  res.status(201).json({
    media: createdMediaItems[0],
    files: createdMediaItems,
  })
}
