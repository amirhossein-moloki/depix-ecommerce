import { GET as adminGetMedia } from "../route"
import { POST as adminUploadMedia } from "../upload/route"
import { DELETE as adminDeleteMedia } from "../[id]/route"
import { MedusaError } from "@medusajs/framework/utils"

describe("Media Management API Endpoints", () => {
  let mockMediaService: any
  let mockBrandService: any
  let mockProductService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    mockMediaService = {
      listAndCountMedia: jest.fn(),
      retrieveMedia: jest.fn(),
      createMedia: jest.fn(),
      deleteMedia: jest.fn(),
    }

    mockBrandService = {
      listAndCountBrands: jest.fn().mockResolvedValue([[], 0]),
    }

    mockProductService = {
      listAndCountProductCategories: jest.fn().mockResolvedValue([[], 0]),
      listAndCountProducts: jest.fn().mockResolvedValue([[], 0]),
    }

    mockReq = {
      scope: {
        resolve: jest.fn((moduleName) => {
          if (moduleName === "media") return mockMediaService
          if (moduleName === "brand") return mockBrandService
          if (moduleName === "product") return mockProductService
          return null
        }),
      },
      validatedQuery: {},
      validatedBody: {},
      params: {},
      queryConfig: { pagination: { skip: 0, take: 20 } },
    }

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    }
  })

  describe("GET /admin/media", () => {
    it("should list paginated media library", async () => {
      const mediaList = [
        { id: "media_1", original_filename: "logo.png", mime_type: "image/png", file_size: 1024 },
      ]
      mockMediaService.listAndCountMedia.mockResolvedValue([mediaList, 1])

      await adminGetMedia(mockReq, mockRes)

      expect(mockMediaService.listAndCountMedia).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        media: mediaList,
        count: 1,
        offset: 0,
        limit: 20,
      })
    })
  })

  describe("POST /admin/media/upload", () => {
    it("should reject upload if no file is provided", async () => {
      mockReq.files = undefined

      await expect(adminUploadMedia(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })

    it("should reject upload for unsupported file type or executables", async () => {
      mockReq.files = {
        file: [
          {
            originalname: "virus.exe",
            buffer: Buffer.from("MZ\x90\x00\x03"),
            size: 5,
          } as any,
        ],
      }

      await expect(adminUploadMedia(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })

    it("should upload valid image successfully", async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x0a,
      ])

      mockReq.files = {
        file: [
          {
            originalname: "banner.png",
            buffer: pngBuffer,
            size: pngBuffer.length,
          } as any,
        ],
      }

      const createdMedia = {
        id: "media_1",
        original_filename: "banner.png",
        mime_type: "image/png",
        url: "/uploads/mock.png",
      }
      mockMediaService.createMedia.mockResolvedValue(createdMedia)

      await adminUploadMedia(mockReq, mockRes)

      expect(mockMediaService.createMedia).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        media: createdMedia,
        files: [createdMedia],
      })
    })
  })

  describe("DELETE /admin/media/:id", () => {
    it("should reject media deletion if referenced by a brand", async () => {
      const media = { id: "media_1", file_key: "logo.png", url: "/uploads/logo.png" }
      mockMediaService.retrieveMedia.mockResolvedValue(media)
      mockBrandService.listAndCountBrands.mockResolvedValue([[{ id: "brand_1" }], 1])

      mockReq.params.id = "media_1"

      await expect(adminDeleteMedia(mockReq, mockRes)).rejects.toThrow(MedusaError)
      expect(mockMediaService.deleteMedia).not.toHaveBeenCalled()
    })

    it("should delete media if not referenced anywhere", async () => {
      const media = { id: "media_1", file_key: "logo.png", url: "/uploads/logo.png" }
      mockMediaService.retrieveMedia.mockResolvedValue(media)
      mockBrandService.listAndCountBrands.mockResolvedValue([[], 0])
      mockProductService.listAndCountProductCategories.mockResolvedValue([[], 0])
      mockProductService.listAndCountProducts.mockResolvedValue([[], 0])

      mockReq.params.id = "media_1"

      await adminDeleteMedia(mockReq, mockRes)

      expect(mockMediaService.deleteMedia).toHaveBeenCalledWith("media_1")
      expect(mockRes.json).toHaveBeenCalledWith({
        id: "media_1",
        object: "media",
        deleted: true,
      })
    })
  })
})
