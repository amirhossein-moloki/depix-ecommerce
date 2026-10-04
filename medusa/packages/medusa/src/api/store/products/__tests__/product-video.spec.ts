import {
  detectProvider,
  extractVideoId,
  generateEmbedUrl,
  getThumbnailFallback,
  validateProvider,
  validateVideoUrl,
} from "@medusajs/product-video"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"
import {
  createProductVideoWorkflow,
  deleteProductVideoWorkflow,
  reorderProductVideosWorkflow,
  updateProductVideoWorkflow,
} from "@medusajs/core-flows"
import { GET as getProductVideos } from "../[id]/videos/route"
import { GET as adminGetVideos } from "../../../admin/product-videos/route"
import { GET as adminGetVideo } from "../../../admin/product-videos/[id]/route"
import { generateProductJsonLd } from "../../../../utils/json-ld/product-json-ld"

describe("Product Video Implementation (Phase 11)", () => {
  describe("1. URL Validation & Provider Helpers", () => {
    it("should accept valid http: and https: URLs", () => {
      expect(() => validateVideoUrl("https://example.com/video.mp4")).not.toThrow()
      expect(() => validateVideoUrl("http://example.com/video.mp4")).not.toThrow()
    })

    it("should reject dangerous and invalid URL schemes", () => {
      expect(() => validateVideoUrl("javascript:alert(1)")).toThrow("Forbidden video URL scheme")
      expect(() => validateVideoUrl("data:text/html,<script>alert(1)</script>")).toThrow("Forbidden video URL scheme")
      expect(() => validateVideoUrl("file:///etc/passwd")).toThrow("Forbidden video URL scheme")
      expect(() => validateVideoUrl("not a url")).toThrow("Invalid URL format")
      expect(() => validateVideoUrl("")).toThrow("Video URL must be a non-empty string")
    })

    it("should validate allowed provider strings", () => {
      expect(validateProvider("youtube")).toBe("youtube")
      expect(validateProvider("VIMEO")).toBe("vimeo")
      expect(validateProvider("aparat")).toBe("aparat")
      expect(validateProvider("mp4")).toBe("mp4")
      expect(validateProvider("external")).toBe("external")
      expect(validateProvider("self_hosted")).toBe("self_hosted")
      expect(() => validateProvider("invalid_provider")).toThrow("Unsupported video provider")
    })

    it("should auto-detect providers based on domain and file extension", () => {
      expect(detectProvider("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube")
      expect(detectProvider("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube")
      expect(detectProvider("https://vimeo.com/123456789")).toBe("vimeo")
      expect(detectProvider("https://www.aparat.com/v/abc1234")).toBe("aparat")
      expect(detectProvider("https://cdn.example.com/demo.mp4")).toBe("mp4")
      expect(detectProvider("https://example.com/embed-player")).toBe("external")
    })

    it("should extract normalized video IDs for YouTube, Vimeo, and Aparat", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=abc123xyz", "youtube")).toBe("abc123xyz")
      expect(extractVideoId("https://youtu.be/abc123xyz", "youtube")).toBe("abc123xyz")
      expect(extractVideoId("https://www.youtube.com/embed/abc123xyz", "youtube")).toBe("abc123xyz")
      expect(extractVideoId("https://vimeo.com/987654321", "vimeo")).toBe("987654321")
      expect(extractVideoId("https://www.aparat.com/v/kL123", "aparat")).toBe("kL123")
    })

    it("should generate trusted embed URLs and fallback thumbnails", () => {
      expect(generateEmbedUrl("youtube", "abc123xyz", "https://youtube.com")).toBe("https://www.youtube.com/embed/abc123xyz")
      expect(generateEmbedUrl("vimeo", "987654321", "https://vimeo.com")).toBe("https://player.vimeo.com/video/987654321")
      expect(getThumbnailFallback("youtube", "abc123xyz")).toBe("https://img.youtube.com/vi/abc123xyz/hqdefault.jpg")
      expect(getThumbnailFallback("external", null, "https://cdn.example.com/thumb.jpg")).toBe("https://cdn.example.com/thumb.jpg")
    })
  })

  describe("2. Product Video Workflows & Validations", () => {
    it("should throw error if product does not exist when creating video", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockRejectedValue(new Error("Not found")),
      }
      const mockVideoService = {}

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRODUCT_VIDEO]: asValue(mockVideoService),
      })

      const { errors } = await createProductVideoWorkflow(container)
        .run({
          input: {
            product_id: "prod_nonexistent",
            video_url: "https://www.youtube.com/watch?v=123",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Product with id prod_nonexistent not found")
    })

    it("should throw error if variant does not belong to product", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest.fn().mockResolvedValue({ id: "var_1", product_id: "prod_other" }),
      }
      const mockVideoService = {}

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRODUCT_VIDEO]: asValue(mockVideoService),
      })

      const { errors } = await createProductVideoWorkflow(container)
        .run({
          input: {
            product_id: "prod_1",
            variant_id: "var_1",
            video_url: "https://www.youtube.com/watch?v=123",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Product variant var_1 does not belong to product prod_1")
    })

    it("should create product video successfully", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
      }
      const mockVideoService = {
        createProductVideos: jest.fn().mockImplementation((data) =>
          Promise.resolve({ id: "pv_1", ...data })
        ),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRODUCT_VIDEO]: asValue(mockVideoService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createProductVideoWorkflow(container).run({
        input: {
          product_id: "prod_1",
          video_url: "https://www.youtube.com/watch?v=abc123xyz",
          title: "Unboxing Video",
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("pv_1")
      expect(result.provider).toBe("youtube")
      expect(result.video_id).toBe("abc123xyz")
      expect(result.thumbnail_url).toBe("https://img.youtube.com/vi/abc123xyz/hqdefault.jpg")
      expect(result.title).toBe("Unboxing Video")
    })

    it("should update product video metadata and status", async () => {
      const existingVideo = {
        id: "pv_1",
        product_id: "prod_1",
        provider: "youtube",
        video_url: "https://www.youtube.com/watch?v=old",
        video_id: "old",
        title: "Old Title",
        status: "active",
      }

      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
      }
      const mockVideoService = {
        retrieveProductVideo: jest.fn().mockResolvedValue(existingVideo),
        updateProductVideos: jest.fn().mockImplementation((data) =>
          Promise.resolve({ ...existingVideo, ...data })
        ),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRODUCT_VIDEO]: asValue(mockVideoService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await updateProductVideoWorkflow(container).run({
        input: {
          id: "pv_1",
          title: "Updated Title",
          status: "inactive",
        },
        container,
        throwOnError: true,
      })

      expect(result.title).toBe("Updated Title")
      expect(result.status).toBe("inactive")
    })

    it("should delete product video", async () => {
      const existingVideo = { id: "pv_1", product_id: "prod_1" }
      const mockVideoService = {
        retrieveProductVideo: jest.fn().mockResolvedValue(existingVideo),
        deleteProductVideos: jest.fn().mockResolvedValue(undefined),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT_VIDEO]: asValue(mockVideoService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await deleteProductVideoWorkflow(container).run({
        input: { id: "pv_1" },
        container,
        throwOnError: true,
      })

      expect(result.deleted).toBe(true)
      expect(mockVideoService.deleteProductVideos).toHaveBeenCalledWith(["pv_1"])
    })

    it("should reorder product videos deterministically", async () => {
      const existingVideos = [
        { id: "pv_1", product_id: "prod_1", sort_order: 0 },
        { id: "pv_2", product_id: "prod_1", sort_order: 1 },
      ]

      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
      }
      const mockVideoService = {
        listAndCountProductVideos: jest.fn().mockResolvedValue([existingVideos, 2]),
        updateProductVideos: jest.fn().mockImplementation((data) =>
          Promise.resolve({ id: data.id, sort_order: data.sort_order })
        ),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRODUCT_VIDEO]: asValue(mockVideoService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await reorderProductVideosWorkflow(container).run({
        input: {
          product_id: "prod_1",
          video_ids: ["pv_2", "pv_1"],
        },
        container,
        throwOnError: true,
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ id: "pv_2", sort_order: 0 })
      expect(result[1]).toEqual({ id: "pv_1", sort_order: 1 })
    })
  })

  describe("3. Store API Endpoints", () => {
    it("should return public active product videos with embed URLs", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
      }
      const mockVideoService = {
        listAndCountProductVideos: jest.fn().mockResolvedValue([
          [
            {
              id: "pv_1",
              product_id: "prod_1",
              provider: "youtube",
              video_url: "https://www.youtube.com/watch?v=abc",
              video_id: "abc",
              title: "Demo",
              thumbnail_url: "https://img.youtube.com/vi/abc/hqdefault.jpg",
              sort_order: 0,
              status: "active",
              metadata: { private_admin_key: "secret" },
            },
          ],
          1,
        ]),
      }

      const req: any = {
        params: { id: "prod_1" },
        query: {},
        scope: {
          resolve: jest.fn((moduleName) => {
            if (moduleName === Modules.PRODUCT) return mockProductService
            if (moduleName === Modules.PRODUCT_VIDEO) return mockVideoService
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getProductVideos(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        product_videos: [
          {
            id: "pv_1",
            product_id: "prod_1",
            variant_id: undefined,
            provider: "youtube",
            video_url: "https://www.youtube.com/watch?v=abc",
            video_id: "abc",
            title: "Demo",
            description: undefined,
            thumbnail_url: "https://img.youtube.com/vi/abc/hqdefault.jpg",
            sort_order: 0,
            embed_url: "https://www.youtube.com/embed/abc",
          },
        ],
        count: 1,
      })
      // Ensure private admin metadata is not exposed in public payload
      expect(jsonMock.mock.calls[0][0].product_videos[0].metadata).toBeUndefined()
    })
  })

  describe("4. Admin API Endpoints", () => {
    it("should list product videos for admin", async () => {
      const mockVideoService = {
        listAndCountProductVideos: jest.fn().mockResolvedValue([
          [
            { id: "pv_1", product_id: "prod_1", title: "Admin Video" },
          ],
          1,
        ]),
      }

      const req: any = {
        validatedQuery: { limit: 10, offset: 0, product_id: "prod_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockVideoService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await adminGetVideos(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        product_videos: [{ id: "pv_1", product_id: "prod_1", title: "Admin Video" }],
        count: 1,
        limit: 10,
        offset: 0,
      })
    })

    it("should retrieve single video details for admin", async () => {
      const mockVideoService = {
        retrieveProductVideo: jest.fn().mockResolvedValue({
          id: "pv_1",
          product_id: "prod_1",
          title: "Video 1",
        }),
      }

      const req: any = {
        params: { id: "pv_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockVideoService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await adminGetVideo(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        product_video: expect.objectContaining({ id: "pv_1", title: "Video 1" }),
      })
    })
  })

  describe("5. Schema.org Product JSON-LD VideoObject Structured Data Integration", () => {
    it("should include VideoObject in Product JSON-LD when active videos exist", () => {
      const mockProduct = {
        id: "prod_video_ld",
        title: "Premium Camera",
        handle: "premium-camera",
        description: "A professional mirrorless camera.",
      }

      const mockVideos = [
        {
          id: "pv_1",
          title: "Product Showcase",
          description: "See the camera in action.",
          thumbnail_url: "https://cdn.example.com/camera-thumb.jpg",
          video_url: "https://www.youtube.com/watch?v=cam123",
          embed_url: "https://www.youtube.com/embed/cam123",
          created_at: "2025-01-15T12:00:00Z",
        },
      ]

      const jsonLd = generateProductJsonLd(mockProduct, {
        baseUrl: "https://depix.store",
        videos: mockVideos,
      })

      expect(jsonLd.video).toEqual({
        "@type": "VideoObject",
        name: "Product Showcase",
        description: "See the camera in action.",
        contentUrl: "https://www.youtube.com/watch?v=cam123",
        thumbnailUrl: "https://cdn.example.com/camera-thumb.jpg",
        embedUrl: "https://www.youtube.com/embed/cam123",
        uploadDate: new Date("2025-01-15T12:00:00Z").toISOString(),
      })
    })
  })
})
