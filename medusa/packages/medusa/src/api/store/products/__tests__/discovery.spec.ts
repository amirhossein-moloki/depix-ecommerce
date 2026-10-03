import { GET as getNewestProducts } from "../newest/route"
import { GET as getBestsellers } from "../bestsellers/route"
import { GET as getRelatedProducts } from "../[id]/related/route"
import { getBestSellingProductsWorkflow } from "../../../../../../core/core-flows/src/product/workflows/get-bestselling-products"
import { getRelatedProductsWorkflow } from "../../../../../../core/core-flows/src/product/workflows/get-related-products"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Store Product Discovery API & Workflows", () => {
  describe("New Products Discovery (GET /store/products/newest)", () => {
    it("should return published products ordered by created_at DESC", async () => {
      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            { id: "prod_new2", title: "Newer Product", created_at: "2025-02-01" },
            { id: "prod_new1", title: "New Product", created_at: "2025-01-01" },
          ],
          2,
        ]),
      }

      const req: any = {
        query: { limit: "10", offset: "0" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockProductService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getNewestProducts(req, res)

      expect(mockProductService.listAndCountProducts).toHaveBeenCalledWith(
        { status: "published" },
        expect.objectContaining({
          take: 10,
          skip: 0,
          order: { created_at: "DESC" },
        })
      )

      expect(jsonMock).toHaveBeenCalledWith({
        products: [
          expect.objectContaining({ id: "prod_new2" }),
          expect.objectContaining({ id: "prod_new1" }),
        ],
        count: 2,
        limit: 10,
        offset: 0,
      })
    })
  })

  describe("Best Sellers Discovery", () => {
    it("should correctly aggregate valid order quantities and rank products", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_1",
              status: "completed",
              items: [
                { product_id: "prod_a", quantity: 5 },
                { product_id: "prod_b", quantity: 15 },
              ],
            },
            {
              id: "ord_2",
              status: "pending",
              items: [
                { product_id: "prod_a", quantity: 20 },
              ],
            },
          ],
          2,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            { id: "prod_a", title: "Product A" },
            { id: "prod_b", title: "Product B" },
          ],
          2,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.ORDER]: asValue(mockOrderService),
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const { result } = await getBestSellingProductsWorkflow(container).run({
        input: {
          limit: 10,
          offset: 0,
          period: "30d",
        },
        container,
        throwOnError: true,
      })

      // prod_a total = 5 + 20 = 25 sold
      // prod_b total = 15 sold
      // Ranking: prod_a, then prod_b
      expect(result.products[0].id).toBe("prod_a")
      expect(result.products[0].sales_quantity).toBe(25)
      expect(result.products[1].id).toBe("prod_b")
      expect(result.products[1].sales_quantity).toBe(15)
    })
  })

  describe("Related Products Discovery", () => {
    it("should exclude current product and rank candidate products by matching category/collection/tags", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({
          id: "prod_target",
          categories: [{ id: "cat_shoes" }],
          collection_id: "col_nike",
          tags: [{ id: "tag_running" }],
        }),
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            {
              id: "prod_match_high",
              title: "Nike Running Shoe",
              created_at: "2025-01-01",
              categories: [{ id: "cat_shoes" }],
              collection_id: "col_nike",
              tags: [{ id: "tag_running" }],
            },
            {
              id: "prod_match_low",
              title: "Generic Shoe",
              created_at: "2025-01-01",
              categories: [{ id: "cat_shoes" }],
              collection_id: "col_other",
              tags: [],
            },
          ],
          2,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const { result } = await getRelatedProductsWorkflow(container).run({
        input: {
          product_id: "prod_target",
          limit: 10,
          offset: 0,
        },
        container,
        throwOnError: true,
      })

      expect(result.products.length).toBe(2)
      expect(result.products[0].id).toBe("prod_match_high")
      expect(result.products[1].id).toBe("prod_match_low")
    })

    it("should throw NOT_FOUND error if target product does not exist", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockRejectedValue(new Error("Not found")),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const { errors } = await getRelatedProductsWorkflow(container)
        .run({
          input: {
            product_id: "prod_invalid",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Product with id prod_invalid not found")
    })
  })
})
