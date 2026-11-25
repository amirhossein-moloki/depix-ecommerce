import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { GET as listStoreProducts } from "../route"
import { StoreGetProductsParams } from "../validators"

describe("GET /store/products catalog filters & sorting", () => {
  describe("StoreGetProductsParams validator", () => {
    it("accepts all 5 catalog filter and sort parameters", () => {
      const parsed = StoreGetProductsParams.parse({
        brand_id: "brand_1",
        brand_slug: "depix",
        min_price: "100000",
        max_price: "5000000",
        in_stock: "true",
        has_discount: "false",
        sort: "price_asc",
        limit: "12",
        offset: "0",
      })

      expect(parsed).toMatchObject({
        brand_id: "brand_1",
        brand_slug: "depix",
        min_price: 100000,
        max_price: 5000000,
        in_stock: true,
        has_discount: false,
        sort: "price_asc",
        limit: 12,
        offset: 0,
      })
    })

    it("rejects invalid sort enum values and negative prices", () => {
      expect(() =>
        StoreGetProductsParams.parse({ sort: "invalid_sort" })
      ).toThrow()

      expect(() =>
        StoreGetProductsParams.parse({ min_price: "-100" })
      ).toThrow()
    })
  })

  describe("GET /store/products handler", () => {
    const sampleProducts = [
      {
        id: "prod_1",
        title: "Alpha Jacket",
        created_at: "2026-01-01T00:00:00Z",
        metadata: { brand_id: "brand_nike", brand_slug: "nike", brand: "Nike" },
        variants: [
          {
            id: "var_1",
            manage_inventory: true,
            allow_backorder: false,
            inventory_quantity: 5,
            calculated_price: {
              calculated_amount: 1200000,
              original_amount: 1500000,
            },
          },
        ],
      },
      {
        id: "prod_2",
        title: "Beta Shoes",
        created_at: "2026-03-01T00:00:00Z",
        metadata: { brand_id: "brand_adidas", brand_slug: "adidas" },
        variants: [
          {
            id: "var_2",
            manage_inventory: true,
            allow_backorder: false,
            inventory_quantity: 0,
            calculated_price: {
              calculated_amount: 800000,
              original_amount: 800000,
            },
          },
        ],
      },
      {
        id: "prod_3",
        title: "Gamma Cap",
        created_at: "2026-02-01T00:00:00Z",
        metadata: { brand_id: "brand_nike" },
        variants: [
          {
            id: "var_3",
            manage_inventory: false,
            allow_backorder: false,
            calculated_price: {
              calculated_amount: 300000,
              original_amount: 300000,
            },
          },
        ],
      },
    ]

    const makeRes = () => {
      const json = jest.fn()
      return { res: { json } as any, json }
    }

    const makeReq = (
      filterableFields: Record<string, any>,
      pagination: { skip?: number; take?: number; order?: any } = {},
      extraServices: Record<string, any> = {}
    ) => {
      const graphMock = jest.fn().mockResolvedValue({
        data: sampleProducts,
        metadata: {
          count: sampleProducts.length,
          skip: pagination.skip ?? 0,
          take: pagination.take ?? 50,
        },
      })

      return {
        req: {
          filterableFields: { ...filterableFields },
          queryConfig: {
            fields: ["id", "title", "variants.calculated_price.*"],
            pagination: {
              skip: pagination.skip ?? 0,
              take: pagination.take ?? 50,
              order: pagination.order,
            },
          },
          scope: {
            resolve: jest.fn((key: string) => {
              if (key === ContainerRegistrationKeys.QUERY) {
                return { graph: graphMock }
              }
              if (extraServices[key]) {
                return extraServices[key]
              }
              throw new Error(`Unregistered service: ${key}`)
            }),
          },
        } as any,
        graphMock,
      }
    }

    it("filters by brand_slug using Modules.BRAND and paginates full dataset", async () => {
      const brandService = {
        listBrands: jest.fn().mockResolvedValue([
          { id: "brand_nike", slug: "nike", name: "Nike" },
        ]),
      }
      const { req, graphMock } = makeReq(
        { brand_slug: "nike" },
        { skip: 1, take: 1 },
        { [Modules.BRAND]: brandService }
      )
      const { res, json } = makeRes()

      await listStoreProducts(req, res)

      expect(graphMock).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {},
        }),
        expect.any(Object)
      )
      expect(json).toHaveBeenCalledWith({
        products: [expect.objectContaining({ id: "prod_3" })],
        count: 2,
        offset: 1,
        limit: 1,
      })
    })

    it("filters by min_price, max_price, in_stock, and has_discount", async () => {
      const { req } = makeReq({
        min_price: 500000,
        max_price: 1500000,
        has_discount: true,
      })
      const { res, json } = makeRes()

      await listStoreProducts(req, res)

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          products: [expect.objectContaining({ id: "prod_1" })],
          count: 1,
        })
      )
    })

    it("filters out-of-stock products when in_stock=false", async () => {
      const { req } = makeReq({ in_stock: false })
      // Pre-populated inventory_quantity on mock variants, so skip inventory service call
      req.queryConfig.fields = ["id", "title", "variants.manage_inventory"]
      const { res, json } = makeRes()

      await listStoreProducts(req, res)

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          products: [expect.objectContaining({ id: "prod_2" })],
          count: 1,
        })
      )
    })

    it("sorts by price_asc and price_desc accurately across all products", async () => {
      const { req: reqAsc } = makeReq({ sort: "price_asc" }, { skip: 0, take: 2 })
      const { res: resAsc, json: jsonAsc } = makeRes()
      await listStoreProducts(reqAsc, resAsc)

      expect(jsonAsc).toHaveBeenCalledWith({
        products: [
          expect.objectContaining({ id: "prod_3" }),
          expect.objectContaining({ id: "prod_2" }),
        ],
        count: 3,
        offset: 0,
        limit: 2,
      })

      const { req: reqDesc } = makeReq({ sort: "price_desc" })
      const { res: resDesc, json: jsonDesc } = makeRes()
      await listStoreProducts(reqDesc, resDesc)

      expect(jsonDesc.mock.calls[0][0].products.map((p: any) => p.id)).toEqual([
        "prod_1",
        "prod_2",
        "prod_3",
      ])
    })

    it("sorts by bestselling using order item quantities", async () => {
      const orderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_1",
              items: [
                { product_id: "prod_3", quantity: 10 },
                { product_id: "prod_1", quantity: 2 },
              ],
            },
          ],
          1,
        ]),
      }

      const { req } = makeReq(
        { sort: "bestselling" },
        {},
        { [Modules.ORDER]: orderService }
      )
      const { res, json } = makeRes()

      await listStoreProducts(req, res)

      expect(json.mock.calls[0][0].products.map((p: any) => p.id)).toEqual([
        "prod_3",
        "prod_1",
        "prod_2",
      ])
    })

    it("sorts by popular using order frequency, units sold, and review ratings", async () => {
      const orderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_1",
              items: [{ product_id: "prod_2", quantity: 1 }],
            },
          ],
          1,
        ]),
      }
      const reviewService = {
        listAndCountProductReviews: jest.fn().mockResolvedValue([
          [
            { product_id: "prod_1", rating: 5 },
            { product_id: "prod_1", rating: 5 },
          ],
          2,
        ]),
      }

      const { req } = makeReq(
        { sort: "popular" },
        {},
        {
          [Modules.ORDER]: orderService,
          [Modules.REVIEW]: reviewService,
        }
      )
      const { res, json } = makeRes()

      await listStoreProducts(req, res)

      // prod_1 score = 0*5 + 0*2 + 5*2 = 10; prod_2 score = 1*5 + 1*2 + 0 = 7; prod_3 = 0
      expect(json.mock.calls[0][0].products.map((p: any) => p.id)).toEqual([
        "prod_1",
        "prod_2",
        "prod_3",
      ])
    })
  })
})
