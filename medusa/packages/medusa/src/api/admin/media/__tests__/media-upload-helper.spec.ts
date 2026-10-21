import {
  detectMimeType,
  getImageDimensions,
  validateAndPrepareUpload,
} from "@medusajs/media"
import { MedusaError } from "@medusajs/framework/utils"

describe("Media Upload Helper & Security Validation", () => {
  it("should detect PNG mime type from magic bytes", () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x32,
    ])
    const mime = detectMimeType(pngHeader)
    expect(mime).toBe("image/png")
  })

  it("should detect JPEG mime type from magic bytes", () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    const mime = detectMimeType(jpegHeader)
    expect(mime).toBe("image/jpeg")
  })

  it("should detect PDF mime type from magic bytes", () => {
    const pdfHeader = Buffer.from("%PDF-1.4\n")
    const mime = detectMimeType(pdfHeader)
    expect(mime).toBe("application/pdf")
  })

  it("should reject executable files or unknown bytes", () => {
    const exeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00")
    const mime = detectMimeType(exeBuffer)
    expect(mime).toBeNull()

    expect(() => {
      validateAndPrepareUpload({
        originalname: "malicious.exe",
        buffer: exeBuffer,
      })
    }).toThrow(MedusaError)
  })

  it("should reject file exceeding max size limit", () => {
    const pngHeader = Buffer.alloc(20 * 1024 * 1024)
    pngHeader[0] = 0x89
    pngHeader[1] = 0x50
    pngHeader[2] = 0x4e
    pngHeader[3] = 0x47

    expect(() => {
      validateAndPrepareUpload(
        {
          originalname: "large.png",
          buffer: pngHeader,
        },
        10 * 1024 * 1024
      )
    }).toThrow(MedusaError)
  })

  it("should extract dimensions from PNG header", () => {
    const pngBuffer = Buffer.alloc(30)
    pngBuffer[0] = 0x89
    pngBuffer[1] = 0x50
    pngBuffer[2] = 0x4e
    pngBuffer[3] = 0x47
    pngBuffer.writeUInt32BE(800, 16)
    pngBuffer.writeUInt32BE(600, 20)

    const dims = getImageDimensions(pngBuffer, "image/png")
    expect(dims.width).toBe(800)
    expect(dims.height).toBe(600)
  })

  it("should sanitize original filenames and prevent path traversal", () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ])
    const res = validateAndPrepareUpload({
      originalname: "../../etc/passwd.png",
      buffer: pngBuffer,
    })

    expect(res.originalFilename).not.toContain("..")
    expect(res.originalFilename).toContain("passwd.png")
    expect(res.fileKey).toMatch(/\.png$/)
  })
})
