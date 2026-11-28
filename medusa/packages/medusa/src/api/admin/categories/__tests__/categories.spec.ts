import { GET as storeGetCategories } from "../../../store/categories/route"
import { GET as storeGetCategoryById } from "../../../store/categories/[id]/route"
import { POST as adminCreateCategory, formatCategory } from "../route"
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

    it("should unwrap array return value on POST /admin/categories", async () => {
      mockProductService.listProductCategories.mockResolvedValue([])
      const newCat = {
        id: "pcat_1",
        name: "Laptops",
        handle: "laptops",
        is_active: true,
        rank: 0,
      }
      mockProductService.createProductCategories.mockResolvedValue([newCat])

      mockReq.validatedBody = {
        name: "Laptops",
        slug: "laptops",
      }

      await adminCreateCategory(mockReq, mockRes)

      const payload = mockRes.json.mock.calls[0][0]
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(Array.isArray(payload.category)).toBe(false)
      expect(payload.category).toEqual(
        expect.objectContaining({
          id: "pcat_1",
          name: "Laptops",
          slug: "laptops",
        })
      )
    })

    it("should throw duplicate error when slug already exists", async () => {
      mockProductService.listProductCategories.mockResolvedValue([{ id: "pcat_existing", handle: "laptops" }])
      mockReq.validatedBody = { name: "Laptops", slug: "laptops" }

      await expect(adminCreateCategory(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })
  })

  describe("PUT /admin/categories/:id", () => {
    it("should call updateProductCategories(id, data) and return single category object with id", async () => {
      const existingCat = {
        id: "pcat_1",
        name: "Shoes",
        handle: "shoes",
        description: "Old",
        is_active: true,
        rank: 0,
        metadata: { existing_key: "keep" },
      }
      const updatedCat = {
        id: "pcat_1",
        name: "Updated Shoes",
        handle: "updated-shoes",
        description: "Fresh",
        is_active: false,
        rank: 3,
        metadata: { existing_key: "keep", image_id: "img_2" },
      }
      mockProductService.retrieveProductCategory.mockResolvedValue(existingCat)
      mockMediaService.retrieveMedia.mockResolvedValue({ id: "img_2" })
      mockProductService.updateProductCategories.mockResolvedValue(updatedCat)

      mockReq.params.id = "pcat_1"
      mockReq.validatedBody = {
        name: "Updated Shoes",
        slug: "Updated-Shoes",
        description: "Fresh",
        image_id: "img_2",
        is_active: false,
        display_order: 3,
      }

      await adminUpdateCategory(mockReq, mockRes)

      expect(mockProductService.updateProductCategories).toHaveBeenCalledWith(
        "pcat_1",
        {
          name: "Updated Shoes",
          handle: "updated-shoes",
          description: "Fresh",
          is_active: false,
          rank: 3,
          metadata: { existing_key: "keep", image_id: "img_2" },
        }
      )
      const payload = mockRes.json.mock.calls[0][0]
      expect(Array.isArray(payload.category)).toBe(false)
      expect(payload).toEqual({
        category: expect.objectContaining({
          id: "pcat_1",
          name: "Updated Shoes",
          handle: "updated-shoes",
          slug: "updated-shoes",
          image_id: "img_2",
          display_order: 3,
          is_active: false,
        }),
      })
    })

    it("should unwrap array result from updateProductCategories and preserve category id", async () => {
      const existingCat = {
        id: "pcat_1",
        name: "Shoes",
        handle: "shoes",
        is_active: true,
        rank: 0,
      }
      const arrayUpdated = [
        {
          id: "pcat_1",
          name: "Array Updated",
          handle: "array-updated",
          is_active: true,
          rank: 1,
        },
      ]
      mockProductService.retrieveProductCategory.mockResolvedValue(existingCat)
      mockProductService.updateProductCategories.mockResolvedValue(arrayUpdated)

      mockReq.params.id = "pcat_1"
      mockReq.validatedBody = { name: "Array Updated", slug: "array-updated", rank: 1 }

      await adminUpdateCategory(mockReq, mockRes)

      const payload = mockRes.json.mock.calls[0][0]
      expect(Array.isArray(payload.category)).toBe(false)
      expect(payload.category).not.toHaveProperty("0")
      expect(payload.category.id).toBe("pcat_1")
      expect(payload.category).toEqual(
        expect.objectContaining({
          id: "pcat_1",
          name: "Array Updated",
          slug: "array-updated",
          display_order: 1,
        })
      )
    })

    it("should refetch category if updateProductCategories returns an object without id", async () => {
      const existingCat = {
        id: "pcat_1",
        name: "Shoes",
        handle: "shoes",
        is_active: true,
        rank: 0,
      }
      const refetchedCat = {
        id: "pcat_1",
        name: "No ID",
        handle: "shoes",
        is_active: true,
        rank: 0,
      }
      mockProductService.retrieveProductCategory
        .mockResolvedValueOnce(existingCat)
        .mockResolvedValueOnce(refetchedCat)
      mockProductService.updateProductCategories.mockResolvedValue({ name: "No ID" })

      mockReq.params.id = "pcat_1"
      mockReq.validatedBody = { name: "No ID" }

      await adminUpdateCategory(mockReq, mockRes)

      expect(mockProductService.retrieveProductCategory).toHaveBeenCalledTimes(2)
      const payload = mockRes.json.mock.calls[0][0]
      expect(payload).toEqual({
        category: expect.objectContaining({
          id: "pcat_1",
          name: "No ID",
        }),
      })
    })

    it("should fallback with existing id when updateProductCategories returns empty array and refetch fails", async () => {
      const existingCat = {
        id: "pcat_1",
        name: "Shoes",
        handle: "shoes",
        is_active: true,
        rank: 0,
      }
      mockProductService.retrieveProductCategory
        .mockResolvedValueOnce(existingCat)
        .mockRejectedValueOnce(new Error("refetch failed"))
      mockProductService.updateProductCategories.mockResolvedValue([])

      mockReq.params.id = "pcat_1"
      mockReq.validatedBody = { name: "Fallback Name" }

      await adminUpdateCategory(mockReq, mockRes)

      const payload = mockRes.json.mock.calls[0][0]
      expect(payload.category).toEqual(
        expect.objectContaining({
          id: "pcat_1",
          name: "Fallback Name",
        })
      )
    })

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

  describe("formatCategory", () => {
    it("should unwrap a single-element array and preserve id", () => {
      const formatted = formatCategory([
        {
          id: "pcat_1",
          name: "Electronics",
          handle: "electronics",
          is_active: true,
          rank: 2,
          metadata: { image_id: "img_1" },
        },
      ])

      expect(formatted).toEqual(
        expect.objectContaining({
          id: "pcat_1",
          name: "Electronics",
          slug: "electronics",
          image_id: "img_1",
          display_order: 2,
        })
      )
    })

    it("should return null for empty array instead of object without id", () => {
      expect(formatCategory([])).toBeNull()
    })
  })
})
