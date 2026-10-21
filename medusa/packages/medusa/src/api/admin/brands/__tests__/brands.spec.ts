import { GET as storeGetBrands, GET as storeGetBrand } from "../../../store/brands/route"
import { GET as storeGetBrandById } from "../../../store/brands/[id]/route"
import { GET as adminGetBrands, POST as adminCreateBrand } from "../route"
import { GET as adminGetBrand, PUT as adminUpdateBrand, DELETE as adminDeleteBrand } from "../[id]/route"
import { MedusaError } from "@medusajs/framework/utils"

describe("Brands API Endpoints", () => {
  let mockBrandService: any
  let mockMediaService: any
  let mockProductService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    mockBrandService = {
      listAndCountBrands: jest.fn(),
      listBrands: jest.fn(),
      retrieveBrand: jest.fn(),
      createBrands: jest.fn(),
      updateBrands: jest.fn(),
      deleteBrands: jest.fn(),
    }

    mockMediaService = {
      retrieveMedia: jest.fn(),
    }

    mockProductService = {
      listAndCountProducts: jest.fn().mockResolvedValue([[], 0]),
    }

    mockReq = {
      scope: {
        resolve: jest.fn((moduleName) => {
          if (moduleName === "brand") return mockBrandService
          if (moduleName === "media") return mockMediaService
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

  describe("GET /store/brands", () => {
    it("should list active brands for store customers", async () => {
      const activeBrands = [
        { id: "brand_1", name: "Nike", slug: "nike", is_active: true },
      ]
      mockBrandService.listAndCountBrands.mockResolvedValue([activeBrands, 1])

      await storeGetBrands(mockReq, mockRes)

      expect(mockBrandService.listAndCountBrands).toHaveBeenCalledWith(
        { is_active: true },
        { skip: 0, take: 20, order: { name: "ASC" } }
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        brands: activeBrands,
        count: 1,
        offset: 0,
        limit: 20,
      })
    })
  })

  describe("GET /store/brands/:id", () => {
    it("should return active brand by id or slug", async () => {
      const activeBrand = { id: "brand_1", name: "Nike", slug: "nike", is_active: true }
      mockBrandService.retrieveBrand.mockResolvedValue(activeBrand)
      mockReq.params.id = "brand_1"

      await storeGetBrandById(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({ brand: activeBrand })
    })

    it("should throw NOT_FOUND for inactive brand in store", async () => {
      const inactiveBrand = { id: "brand_1", name: "Nike", slug: "nike", is_active: false }
      mockBrandService.retrieveBrand.mockResolvedValue(inactiveBrand)
      mockReq.params.id = "brand_1"

      await expect(storeGetBrandById(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })
  })

  describe("POST /admin/brands", () => {
    it("should create brand successfully with unique slug", async () => {
      mockBrandService.listBrands.mockResolvedValue([]) // No duplicate
      const createdBrand = { id: "brand_1", name: "Adidas", slug: "adidas", is_active: true }
      mockBrandService.createBrands.mockResolvedValue(createdBrand)

      mockReq.validatedBody = {
        name: "Adidas",
        slug: "adidas",
        description: "Sports brand",
      }

      await adminCreateBrand(mockReq, mockRes)

      expect(mockBrandService.createBrands).toHaveBeenCalledWith({
        name: "Adidas",
        slug: "adidas",
        description: "Sports brand",
        logo_id: null,
        is_active: true,
        metadata: null,
      })
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({ brand: createdBrand })
    })

    it("should reject creation if slug conflicts with existing brand", async () => {
      mockBrandService.listBrands.mockResolvedValue([{ id: "brand_existing", slug: "adidas" }])
      mockReq.validatedBody = { name: "Adidas New", slug: "adidas" }

      await expect(adminCreateBrand(mockReq, mockRes)).rejects.toThrow(MedusaError)
    })
  })

  describe("DELETE /admin/brands/:id", () => {
    it("should prevent brand deletion if referenced by products", async () => {
      const brand = { id: "brand_1", name: "Puma", slug: "puma" }
      mockBrandService.retrieveBrand.mockResolvedValue(brand)
      mockProductService.listAndCountProducts.mockResolvedValue([[{ id: "prod_1" }], 1])
      mockReq.params.id = "brand_1"

      await expect(adminDeleteBrand(mockReq, mockRes)).rejects.toThrow(MedusaError)
      expect(mockBrandService.deleteBrands).not.toHaveBeenCalled()
    })

    it("should delete brand if not referenced by products", async () => {
      const brand = { id: "brand_1", name: "Puma", slug: "puma" }
      mockBrandService.retrieveBrand.mockResolvedValue(brand)
      mockProductService.listAndCountProducts.mockResolvedValue([[], 0])
      mockReq.params.id = "brand_1"

      await adminDeleteBrand(mockReq, mockRes)

      expect(mockBrandService.deleteBrands).toHaveBeenCalledWith("brand_1")
      expect(mockRes.json).toHaveBeenCalledWith({
        id: "brand_1",
        object: "brand",
        deleted: true,
      })
    })
  })
})
