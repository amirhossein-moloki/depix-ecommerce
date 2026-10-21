import { GET as storeGetCategories } from "../../../store/categories/route"
import { GET as storeGetCategoryById } from "../../../store/categories/[id]/route"
import { POST as adminCreateCategory } from "../route"
import { PUT as adminUpdateCategory, DELETE as adminDeleteCategory } from "../[id]/route"
import { MedusaError } from "@medusajs/framework/utils"

describe("Categories Management API Endpoints", () => {
  let mockProductService: any
  let mockMediaService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    mockProductService = {
      listAndCountProductCategories: jest.fn(),
      listProductCategories: jest.fn().mockResolvedValue([]),
      retrieveProductCategory: jest.fn(),
      createProductCategories: jest.fn(),
      updateProductCategories: jest.fn(),
      deleteProductCategories: jest.fn(),
    }

    mockMediaService = {
      retrieveMedia: jest.fn(),
    }

    mockReq = {
      scope: {
        resolve: jest.fn((moduleName) => {
          if (moduleName === "product") return mockProductService
          if (moduleName === "media") return mockMediaService
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

  describe("GET /store/categories", () => {
    it("should list active and publishable categories only", async () => {
      const categories = [
        { id: "pcat_1", name: "Electronics", handle: "electronics", is_active: true, is_internal: false, rank: 0 },
      ]
      mockProductService.listAndCountProductCategories.mockResolvedValue([categories, 1])

      await storeGetCategories(mockReq, mockRes)

      expect(mockProductService.listAndCountProductCategories).toHaveBeenCalledWith(
        { is_active: true, is_internal: false },
        { skip: 0, take: 20, order: { rank: "ASC" } }
      )
    })
  })

  describe("POST /admin/categories", () => {
    it("should create category with unique handle", async () => {
      mockProductService.listProductCategories.mockResolvedValue([]) // No duplicate handle
      const newCat = { id: "pcat_1", name: "Laptops", handle: "laptops", is_active: true, rank: 0 }
      mockProductService.createProductCategories.mockResolvedValue(newCat)

      mockReq.validatedBody = {
        name: "Laptops",
        slug: "laptops",
      }

      await adminCreateCategory(mockReq, mockRes)

      expect(mockProductService.createProductCategories).toHaveBeenCalledWith({
        name: "Laptops",
        handle: "laptops",
        description: "",
        is_active: true,
        rank: 0,
        parent_category_id: null,
        metadata: {},
      })
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })

    it("should throw duplicate error when slug already exists", async () => {
      mockProductService.listProductCategories.mockResolvedValue([{ id: "pcat_existing", handle: "laptops" }])
      mockReq.validatedBody = { name: "Laptops", slug: "laptops" }

      await expect(adminCreateCategory(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })
  })

  describe("PUT /admin/categories/:id", () => {
    it("should reject self-parenting attempt", async () => {
      const cat = { id: "pcat_1", name: "Shoes", handle: "shoes" }
      mockProductService.retrieveProductCategory.mockResolvedValue(cat)

      mockReq.params.id = "pcat_1"
      mockReq.validatedBody = { parent_category_id: "pcat_1" }

      await expect(adminUpdateCategory(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })

    it("should reject circular category parenting", async () => {
      // Setup catA ("pcat_A") whose child is catB ("pcat_B"). Attempting to set catA's parent to catB creates cycle!
      const catA = { id: "pcat_A", name: "Category A", handle: "cat-a", parent_category_id: null }
      const catB = { id: "pcat_B", name: "Category B", handle: "cat-b", parent_category_id: "pcat_A" }

      mockProductService.retrieveProductCategory.mockImplementation((id: string) => {
        if (id === "pcat_A") return Promise.resolve(catA)
        if (id === "pcat_B") return Promise.resolve(catB)
        return Promise.reject(new Error("Not found"))
      })

      mockReq.params.id = "pcat_A"
      mockReq.validatedBody = { parent_category_id: "pcat_B" }

      await expect(adminUpdateCategory(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })
  })

  describe("DELETE /admin/categories/:id", () => {
    it("should delete category while preserving products", async () => {
      const cat = { id: "pcat_1", name: "Shirts", handle: "shirts" }
      mockProductService.retrieveProductCategory.mockResolvedValue(cat)
      mockReq.params.id = "pcat_1"

      await adminDeleteCategory(mockReq, mockRes)

      expect(mockProductService.deleteProductCategories).toHaveBeenCalledWith("pcat_1")
      expect(mockRes.json).toHaveBeenCalledWith({
        id: "pcat_1",
        object: "category",
        deleted: true,
      })
    })
  })
})
