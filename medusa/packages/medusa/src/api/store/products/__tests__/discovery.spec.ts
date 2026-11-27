import { GET as getNewestProducts } from "../newest/route"
import { GET as getBestsellers } from "../bestsellers/route"
import { GET as getRelatedProducts } from "../[id]/related/route"
import { getBestSellingProductsWorkflow } from "../../../../../../core/core-flows/src/product/workflows/get-bestselling-products"
import { getRelatedProductsWorkflow } from "../../../../../../core/core-flows/src/product/workflows/get-related-products"
import { ContainerRegistrationKeys, createMedusaContainer, Modules } from "@medusajs/framework/utils"
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

    it("enriches GET /store/products/:id/related with realPrice, finalPrice, discount, stock, brand, variants.prices, and inventory_quantity", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({
          id: "prod_target",
          categories: [{ id: "cat_tools" }],
        }),
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            {
              id: "prod_rel_1",
              title: "Bosch Drill",
              created_at: "2025-02-01",
              categories: [{ id: "cat_tools" }],
            },
          ],
          1,
        ]),
      }

      const mockBrandService = {
        listBrands: jest.fn().mockResolvedValue([
          {
            id: "brand_bosch",
            name: "بوش",
            slug: "bosch",
            logo_id: "med_1",
            metadata: null,
          },
        ]),
      }

      const mockQuery = {
        graph: jest.fn().mockImplementation(({ entity }: any) => {
          if (entity === "store") {
            return Promise.resolve({
              data: [{ id: "store_1", default_region_id: "reg_ir" }],
            })
          }
          if (entity === "region") {
            return Promise.resolve({
              data: [{ id: "reg_ir", currency_code: "irr" }],
            })
          }
          if (entity === "product") {
            return Promise.resolve({
              data: [
                {
                  id: "prod_rel_1",
                  metadata: { brand_slug: "bosch" },
                  variants: [
                    {
                      id: "var_rel_1",
                      manage_inventory: true,
                      prices: [{ id: "pr_1", currency_code: "irr", amount: 1000000 }],
                      calculated_price: {
                        original_amount: 1000000,
                        calculated_amount: 1000000,
                        currency_code: "irr",
                      },
                    },
                  ],
                },
              ],
            })
          }
          if (entity === "product_variant_inventory_items") {
            return Promise.resolve({
              data: [
                {
                  variant_id: "var_rel_1",
                  required_quantity: 1,
                  variant: { manage_inventory: true, allow_backorder: false },
                  inventory: {
                    location_levels: [
                      { location_id: "sloc_1", available_quantity: 4 },
                    ],
                  },
                },
              ],
            })
          }
          return Promise.resolve({ data: [] })
        }),
      }

      const mockRemoteQuery = jest.fn().mockResolvedValue([
        {
          id: "promo_auto_20",
          code: "AUTO20",
          status: "active",
          is_automatic: true,
          metadata: {},
          application_method: {
            type: "percentage",
            value: 20,
            target_type: "items",
            target_rules: [],
          },
        },
      ])

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.BRAND]: asValue(mockBrandService),
        [ContainerRegistrationKeys.QUERY]: asValue(mockQuery),
        [ContainerRegistrationKeys.REMOTE_QUERY]: asValue(mockRemoteQuery),
      })

      const req: any = {
        params: { id: "prod_target" },
        query: { limit: "10", offset: "0" },
        scope: container,
      }
      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getRelatedProducts(req, res)

      const payload = jsonMock.mock.calls[0][0]
      expect(payload.products).toHaveLength(1)
      expect(payload.products[0]).toMatchObject({
        id: "prod_rel_1",
        realPrice: 1000000,
        finalPrice: 800000,
        discount: 20,
        stock: true,
        brand: expect.objectContaining({
          id: "brand_bosch",
          slug: "bosch",
          name: "بوش",
        }),
      })
      expect(payload.products[0].variants[0].prices).toEqual([
        { id: "pr_1", currency_code: "irr", amount: 1000000 },
      ])
      expect(payload.products[0].variants[0].inventory_quantity).toBe(4)
    })
  })
})
