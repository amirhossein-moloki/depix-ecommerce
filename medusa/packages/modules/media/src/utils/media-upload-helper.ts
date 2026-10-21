import crypto from "crypto"
import fs from "fs"
import path from "path"
import { MedusaError } from "@medusajs/framework/utils"

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * Detect actual MIME type based on buffer magic bytes
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) {
    return null
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png"
  }

  // GIF: 47 49 46 38 ("GIF8")
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif"
  }

  // WEBP: "RIFF" at 0-3, "WEBP" at 8-11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp"
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf"
  }

  // SVG check (text based, starts with <svg or <?xml)
  const headStr = buffer.slice(0, 500).toString("utf8").trim().toLowerCase()
  if (headStr.includes("<svg") || (headStr.includes("<?xml") && headStr.includes("<svg"))) {
    return "image/svg+xml"
  }

  return null
}

/**
 * Get dimensions for images (width, height)
 */
export function getImageDimensions(
  buffer: Buffer,
  mimeType: string
): { width: number | null; height: number | null } {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)
      return { width, height }
    }

    if (mimeType === "image/jpeg" && buffer.length > 2) {
      let offset = 2
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break
        const marker = buffer[offset + 1]
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }
        const blockLength = buffer.readUInt16BE(offset + 2)
        offset += 2 + blockLength
      }
    }

    if (mimeType === "image/gif" && buffer.length >= 10) {
      const width = buffer.readUInt16LE(6)
      const height = buffer.readUInt16LE(8)
      return { width, height }
    }

    if (mimeType === "image/webp" && buffer.length >= 30) {
      const type = buffer.toString("utf8", 12, 16)
      if (type === "VP8 ") {
        const width = buffer.readUInt16LE(26) & 0x3fff
        const height = buffer.readUInt16LE(28) & 0x3fff
        return { width, height }
      } else if (type === "VP8L") {
        const b0 = buffer[21]
        const b1 = buffer[22]
        const b2 = buffer[23]
        const b3 = buffer[24]
        const width = 1 + (((b1 & 0x3f) << 8) | b0)
        const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
        return { width, height }
      }
    }
  } catch (e) {
    // Return null if dimension parsing fails
  }

  return { width: null, height: null }
}

/**
 * Sanitize filename and return safe extension
 */
export function getSafeExtension(originalFilename: string, mimeType: string): string {
  const extFromFilename = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9]/g, "")
  if (extFromFilename && ["jpg", "jpeg", "png", "webp", "gif", "svg", "pdf"].includes(extFromFilename)) {
    return extFromFilename === "jpg" ? "jpeg" : extFromFilename
  }

  switch (mimeType) {
    case "image/jpeg":
      return "jpeg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/svg+xml":
      return "svg"
    case "application/pdf":
      return "pdf"
    default:
      return "bin"
  }
}

/**
 * Validate upload payload and return file metadata
 */
export function validateAndPrepareUpload(
  file: { originalname: string; buffer: Buffer; size?: number },
  maxSizeBytes = MAX_FILE_SIZE_BYTES
) {
  if (!file || !file.buffer) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No file data provided"
    )
  }

  const fileSize = file.size || file.buffer.length
  if (fileSize > maxSizeBytes) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `File size exceeds maximum limit of ${Math.floor(maxSizeBytes / (1024 * 1024))}MB`
    )
  }

  // Detect mime type by buffer magic bytes
  const detectedMime = detectMimeType(file.buffer)
  if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unsupported or invalid file content type: ${detectedMime || "unknown"}`
    )
  }

  // Prevent path traversal in original filename
  const cleanOriginalFilename = path.basename(file.originalname).replace(/[^a-zA-Z0-9_.-]/g, "_")
  const ext = getSafeExtension(cleanOriginalFilename, detectedMime)
  const uniqueKey = `${crypto.randomUUID()}.${ext}`

  const dimensions = getImageDimensions(file.buffer, detectedMime)

  return {
    originalFilename: cleanOriginalFilename,
    fileKey: uniqueKey,
    mimeType: detectedMime,
    fileSize,
    dimensions,
  }
}

/**
 * Save file to local storage directory safely
 */
export async function saveFileToLocalStorage(
  fileKey: string,
  buffer: Buffer,
  targetDir = "uploads"
): Promise<{ filePath: string; url: string }> {
  const uploadDir = path.resolve(process.cwd(), targetDir)
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  // Ensure fileKey cannot traverse directories
  const safeFileKey = path.basename(fileKey)
  const filePath = path.join(uploadDir, safeFileKey)

  await fs.promises.writeFile(filePath, buffer)

  const url = `/${targetDir}/${safeFileKey}`
  return { filePath, url }
}

/**
 * Delete file from local storage safely
 */
export async function deleteFileFromLocalStorage(
  fileKey: string,
  targetDir = "uploads"
): Promise<void> {
  try {
    const safeFileKey = path.basename(fileKey)
    const filePath = path.resolve(process.cwd(), targetDir, safeFileKey)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (e) {
    // Ignore if file doesn't exist
  }
}
