import { GET as getComparison } from "../route"
import { POST as addComparisonItem } from "../items/route"
import { DELETE as removeComparisonItem } from "../items/[id]/route"
import { GET as compareProducts } from "../../products/compare/route"
import { addComparisonItemWorkflow } from "../../../../../../core/core-flows/src/comparison/workflows/add-comparison-item"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Store Product Comparison API & Workflows", () => {
  describe("addComparisonItemWorkflow", () => {
    it("should throw NOT_FOUND if product does not exist", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockRejectedValue(new Error("Not found")),
      }
      const mockComparisonService = {
        listAndCountComparisons: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.COMPARISON]: asValue(mockComparisonService),
      })

      const { errors } = await addComparisonItemWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_invalid",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Product with id prod_invalid not found")
    })

    it("should enforce comparison limit of 5 products max", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_6" }),
      }

      const mockComparisonService = {
        listAndCountComparisons: jest.fn().mockResolvedValue([
          [
            {
              id: "comp_1",
              customer_id: "cus_1",
              items: [
                { id: "ci_1", product_id: "prod_1" },
                { id: "ci_2", product_id: "prod_2" },
                { id: "ci_3", product_id: "prod_3" },
                { id: "ci_4", product_id: "prod_4" },
                { id: "ci_5", product_id: "prod_5" },
              ],
            },
          ],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.COMPARISON]: asValue(mockComparisonService),
      })

      const { errors } = await addComparisonItemWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_6",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Comparison limit exceeded. Maximum 5 products allowed."
      )
    })

    it("should return existing item if duplicate product added to comparison", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
      }

      const existingItem = { id: "ci_1", product_id: "prod_1" }
      const mockComparisonService = {
        listAndCountComparisons: jest.fn().mockResolvedValue([
          [
            {
              id: "comp_1",
              customer_id: "cus_1",
              items: [existingItem],
            },
          ],
          1,
        ]),
        createComparisonItems: jest.fn(),
      }

      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.COMPARISON]: asValue(mockComparisonService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await addComparisonItemWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.item.id).toBe("ci_1")
      expect(mockComparisonService.createComparisonItems).not.toHaveBeenCalled()
    })
  })

  describe("Store Comparison API Routes", () => {
    it("should return populated comparison list with max_items = 5", async () => {
      const mockComparisonService = {
        listAndCountComparisons: jest.fn().mockResolvedValue([
          [
            {
              id: "comp_1",
              customer_id: "cus_1",
              items: [{ id: "ci_1", comparison_id: "comp_1", product_id: "prod_1" }],
            },
          ],
          1,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            {
              id: "prod_1",
              title: "Product A",
              description: "A cool product",
              variants: [],
            },
          ],
          1,
        ]),
      }

      const req: any = {
        auth_context: { actor_id: "cus_1" },
        scope: {
          resolve: jest.fn((moduleName) => {
            if (moduleName === Modules.COMPARISON) return mockComparisonService
            if (moduleName === Modules.PRODUCT) return mockProductService
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getComparison(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        comparison: expect.objectContaining({
          id: "comp_1",
          max_items: 5,
          items: [
            expect.objectContaining({
              id: "ci_1",
              product_id: "prod_1",
              product: expect.objectContaining({ title: "Product A" }),
            }),
          ],
        }),
      })
    })

    it("should compare products by query string IDs (GET /store/products/compare?ids=p1,p2)", async () => {
      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            { id: "prod_1", title: "Product 1" },
            { id: "prod_2", title: "Product 2" },
          ],
          2,
        ]),
      }

      const req: any = {
        query: { ids: "prod_1, prod_2" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockProductService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await compareProducts(req, res)

      expect(mockProductService.listAndCountProducts).toHaveBeenCalledWith(
        { id: ["prod_1", "prod_2"], status: "published" },
        expect.anything()
      )
      expect(jsonMock).toHaveBeenCalledWith({
        products: [
          expect.objectContaining({ id: "prod_1" }),
          expect.objectContaining({ id: "prod_2" }),
        ],
        count: 2,
        max_items: 5,
      })
    })

    it("should throw error if query string IDs exceeds limit of 5", async () => {
      const req: any = {
        query: { ids: "p1,p2,p3,p4,p5,p6" },
        scope: { resolve: jest.fn() },
      }
      const res: any = {}

      await expect(compareProducts(req, res)).rejects.toThrow(
        "Comparison limit exceeded. Maximum 5 products allowed."
      )
    })
  })
})
