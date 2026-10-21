import { GET as adminGetTemplates, POST as adminCreateTemplate } from "../templates/route"
import {
  GET as adminGetTemplate,
  PATCH as adminUpdateTemplate,
  DELETE as adminDeleteTemplate,
} from "../templates/[id]/route"
import {
  GET as adminGetProductSizeGuide,
  PUT as adminUpsertProductSizeGuide,
  DELETE as adminDeleteProductSizeGuide,
} from "../../products/[id]/size-guide/route"
import { GET as storeGetProductSizeGuide } from "../../../store/products/[id]/size-guide/route"
import { SizeGuideModuleService } from "@medusajs/size-guide"
import { MedusaError } from "@medusajs/framework/utils"

describe("Size Guide Module & API Endpoints", () => {
  let mockSizeGuideService: any
  let mockProductService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    const realService = new SizeGuideModuleService({} as any)

    mockSizeGuideService = {
      listAndCountSizeGuideTemplates: jest.fn(),
      retrieveSizeGuideTemplate: jest.fn(),
      createSizeGuideTemplates: jest.fn(),
      updateSizeGuideTemplates: jest.fn(),
      deleteSizeGuideTemplates: jest.fn(),
      listProductSizeGuides: jest.fn(),
      createProductSizeGuides: jest.fn(),
      updateProductSizeGuides: jest.fn(),
      deleteProductSizeGuides: jest.fn(),
      validateSizeGuideData: realService.validateSizeGuideData.bind(realService),
      cloneTemplateToProductGuide: jest.fn(),
    }

    mockProductService = {
      retrieveProduct: jest.fn(),
    }

    mockReq = {
      scope: {
        resolve: jest.fn((moduleName) => {
          if (moduleName === "size_guide") return mockSizeGuideService
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

  describe("Validation Logic (validateSizeGuideData)", () => {
    it("should accept valid columns and rows structure", () => {
      const columns = [
        { id: "col_1", label: "سایز" },
        { id: "col_2", label: "دور سینه (cm)" },
      ]
      const rows = [
        { id: "row_1", cells: { col_1: "M", col_2: "88-92" } },
      ]

      const result = mockSizeGuideService.validateSizeGuideData(columns, rows)
      expect(result.columns).toHaveLength(2)
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].cells).toEqual({ col_1: "M", col_2: "88-92" })
    })

    it("should reject empty columns array", () => {
      expect(() =>
        mockSizeGuideService.validateSizeGuideData([], [])
      ).toThrow(MedusaError)
    })

    it("should reject column without label", () => {
      const columns = [{ id: "col_1", label: "" }]
      expect(() =>
        mockSizeGuideService.validateSizeGuideData(columns, [])
      ).toThrow(MedusaError)
    })

    it("should reject duplicate column IDs", () => {
      const columns = [
        { id: "col_1", label: "Size" },
        { id: "col_1", label: "Chest" },
      ]
      expect(() =>
        mockSizeGuideService.validateSizeGuideData(columns, [])
      ).toThrow(MedusaError)
    })

    it("should reject duplicate row IDs", () => {
      const columns = [{ id: "col_1", label: "Size" }]
      const rows = [
        { id: "row_1", cells: { col_1: "S" } },
        { id: "row_1", cells: { col_1: "M" } },
      ]
      expect(() =>
        mockSizeGuideService.validateSizeGuideData(columns, rows)
      ).toThrow(MedusaError)
    })
  })

  describe("Admin Template Endpoints", () => {
    describe("GET /admin/size-guides/templates", () => {
      it("should list size guide templates", async () => {
        const templates = [
          { id: "sgtmpl_1", name: "راهنمای لباس زنانه", is_active: true },
        ]
        mockSizeGuideService.listAndCountSizeGuideTemplates.mockResolvedValue([templates, 1])

        await adminGetTemplates(mockReq, mockRes)

        expect(mockSizeGuideService.listAndCountSizeGuideTemplates).toHaveBeenCalledWith(
          {},
          { skip: 0, take: 20, order: { created_at: "DESC" } }
        )
        expect(mockRes.json).toHaveBeenCalledWith({
          size_guide_templates: templates,
          count: 1,
          offset: 0,
          limit: 20,
        })
      })
    })

    describe("POST /admin/size-guides/templates", () => {
      it("should create a template successfully", async () => {
        const columns = [{ id: "col_1", label: "سایز" }]
        const rows = [{ id: "row_1", cells: { col_1: "M" } }]
        const created = {
          id: "sgtmpl_100",
          name: "قالب تیشرت",
          columns,
          rows,
          is_active: true,
        }
        mockSizeGuideService.createSizeGuideTemplates.mockResolvedValue(created)

        mockReq.validatedBody = {
          name: "قالب تیشرت",
          columns,
          rows,
        }

        await adminCreateTemplate(mockReq, mockRes)

        expect(mockSizeGuideService.createSizeGuideTemplates).toHaveBeenCalledWith({
          name: "قالب تیشرت",
          description: null,
          columns,
          rows,
          notes: null,
          is_active: true,
          metadata: null,
        })
        expect(mockRes.status).toHaveBeenCalledWith(201)
        expect(mockRes.json).toHaveBeenCalledWith({ size_guide_template: created })
      })
    })

    describe("GET /admin/size-guides/templates/:id", () => {
      it("should return template detail by id", async () => {
        const template = { id: "sgtmpl_1", name: "قالب شلوار" }
        mockSizeGuideService.retrieveSizeGuideTemplate.mockResolvedValue(template)
        mockReq.params.id = "sgtmpl_1"

        await adminGetTemplate(mockReq, mockRes)

        expect(mockRes.json).toHaveBeenCalledWith({ size_guide_template: template })
      })

      it("should throw 404 for unknown template id", async () => {
        mockSizeGuideService.retrieveSizeGuideTemplate.mockRejectedValue(new Error("Not found"))
        mockReq.params.id = "unknown"

        await expect(adminGetTemplate(mockReq, mockRes)).rejects.toThrow(MedusaError)
      })
    })

    describe("DELETE /admin/size-guides/templates/:id", () => {
      it("should prevent deletion if assigned to products", async () => {
        const template = { id: "sgtmpl_1", name: "قالب عمومی" }
        mockSizeGuideService.retrieveSizeGuideTemplate.mockResolvedValue(template)
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([
          [{ id: "psguide_1", product_id: "prod_1" }],
          1,
        ])
        mockReq.params.id = "sgtmpl_1"

        await expect(adminDeleteTemplate(mockReq, mockRes)).rejects.toThrow(MedusaError)
        expect(mockSizeGuideService.deleteSizeGuideTemplates).not.toHaveBeenCalled()
      })

      it("should delete template when unassigned", async () => {
        const template = { id: "sgtmpl_1", name: "قالب عمومی" }
        mockSizeGuideService.retrieveSizeGuideTemplate.mockResolvedValue(template)
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([[], 0])
        mockReq.params.id = "sgtmpl_1"

        await adminDeleteTemplate(mockReq, mockRes)

        expect(mockSizeGuideService.deleteSizeGuideTemplates).toHaveBeenCalledWith("sgtmpl_1")
        expect(mockRes.json).toHaveBeenCalledWith({
          id: "sgtmpl_1",
          object: "size_guide_template",
          deleted: true,
        })
      })
    })
  })

  describe("Admin Product Size Guide Endpoints", () => {
    describe("GET /admin/products/:id/size-guide", () => {
      it("should return size guide for product", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({ id: "prod_1" })
        const guide = { id: "psguide_1", product_id: "prod_1", title: "راهنمای محصول" }
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([[guide], 1])
        mockReq.params.id = "prod_1"

        await adminGetProductSizeGuide(mockReq, mockRes)

        expect(mockRes.json).toHaveBeenCalledWith({ size_guide: guide })
      })

      it("should throw 404 if product does not exist", async () => {
        mockProductService.retrieveProduct.mockResolvedValue(null)
        mockReq.params.id = "prod_missing"

        await expect(adminGetProductSizeGuide(mockReq, mockRes)).rejects.toThrow(MedusaError)
      })
    })

    describe("PUT /admin/products/:id/size-guide", () => {
      it("should assign guide cloned from template when source_template_id provided", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({ id: "prod_1", title: "پیراهن مردانه" })
        const cloned = { id: "psguide_cloned", product_id: "prod_1", title: "پیراهن مردانه" }
        mockSizeGuideService.cloneTemplateToProductGuide.mockResolvedValue(cloned)

        mockReq.params.id = "prod_1"
        mockReq.validatedBody = {
          source_template_id: "sgtmpl_1",
        }

        await adminUpsertProductSizeGuide(mockReq, mockRes)

        expect(mockSizeGuideService.cloneTemplateToProductGuide).toHaveBeenCalledWith(
          "prod_1",
          "sgtmpl_1",
          {
            title: undefined,
            description: undefined,
            notes: undefined,
            image_id: undefined,
            image_url: undefined,
          }
        )
        expect(mockRes.json).toHaveBeenCalledWith({ size_guide: cloned })
      })

      it("should upsert custom guide for product", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({ id: "prod_1", title: "کفش ورزشی" })
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([[], 0])
        const created = { id: "psguide_custom", product_id: "prod_1", title: "راهنمای کفش" }
        mockSizeGuideService.createProductSizeGuides.mockResolvedValue(created)

        mockReq.params.id = "prod_1"
        mockReq.validatedBody = {
          title: "راهنمای کفش",
          columns: [{ id: "col_1", label: "سایز" }],
          rows: [{ id: "row_1", cells: { col_1: "42" } }],
        }

        await adminUpsertProductSizeGuide(mockReq, mockRes)

        expect(mockSizeGuideService.createProductSizeGuides).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({ size_guide: created })
      })
    })

    describe("DELETE /admin/products/:id/size-guide", () => {
      it("should remove size guide from product", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({ id: "prod_1" })
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([
          [{ id: "psguide_1", product_id: "prod_1" }],
          1,
        ])
        mockReq.params.id = "prod_1"

        await adminDeleteProductSizeGuide(mockReq, mockRes)

        expect(mockSizeGuideService.deleteProductSizeGuides).toHaveBeenCalledWith("psguide_1")
        expect(mockRes.json).toHaveBeenCalledWith({
          id: "psguide_1",
          object: "product_size_guide",
          deleted: true,
        })
      })
    })
  })

  describe("Public Store API Endpoint", () => {
    describe("GET /store/products/:id/size-guide", () => {
      it("should return size guide for published product", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({
          id: "prod_1",
          status: "published",
        })
        const guide = {
          id: "psguide_1",
          product_id: "prod_1",
          title: "راهنمای سایز پیراهن",
          description: "ابعاد سانتی‌متر",
          columns: [{ id: "col_1", label: "سایز" }],
          rows: [{ id: "row_1", cells: { col_1: "L" } }],
          notes: "اندازه‌ها بدون کشسانی است",
          image_url: "https://example.com/guide.jpg",
          metadata: { internal_notes: "secret" },
        }
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([[guide], 1])
        mockReq.params.id = "prod_1"

        await storeGetProductSizeGuide(mockReq, mockRes)

        expect(mockRes.json).toHaveBeenCalledWith({
          size_guide: {
            id: "psguide_1",
            product_id: "prod_1",
            title: "راهنمای سایز پیراهن",
            description: "ابعاد سانتی‌متر",
            columns: [{ id: "col_1", label: "سایز" }],
            rows: [{ id: "row_1", cells: { col_1: "L" } }],
            notes: "اندازه‌ها بدون کشسانی است",
            image_url: "https://example.com/guide.jpg",
          },
        })
      })

      it("should throw 404 for unpublished product", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({
          id: "prod_draft",
          status: "draft",
        })
        mockReq.params.id = "prod_draft"

        await expect(storeGetProductSizeGuide(mockReq, mockRes)).rejects.toThrow(MedusaError)
      })

      it("should return null size guide if product has no size guide assigned", async () => {
        mockProductService.retrieveProduct.mockResolvedValue({
          id: "prod_1",
          status: "published",
        })
        mockSizeGuideService.listProductSizeGuides.mockResolvedValue([[], 0])
        mockReq.params.id = "prod_1"

        await storeGetProductSizeGuide(mockReq, mockRes)

        expect(mockRes.json).toHaveBeenCalledWith({ size_guide: null })
      })
    })
  })
})
