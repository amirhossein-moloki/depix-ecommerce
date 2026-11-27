import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { GET as listAdminProducts } from "../route"
import { GET as getAdminProduct } from "../[id]/route"
import { GET as listStoreProducts } from "../../../store/products/route"
import { GET as getStoreProduct } from "../../../store/products/[id]/route"
import { enrichProductsWithBrand } from "../../../utils/enrich-products-with-brand"

describe("enrichProductsWithBrand & product brand hydration", () => {
  const nikeBrand = {
    id: "brand_nike",
    name: "Nike",
    slug: "nike",
    logo_id: "med_nike",
    metadata: { country: "US" },
  }

  const boschBrand = {
    id: "brand_bosch",
    name: "بوش",
    slug: "bosch",
    logo_id: "med_bosch",
    metadata: { logo: "https://cdn.example.com/bosch.webp" },
  }

  it("batches brand lookups by brand_id, brand_slug, and brand name and attaches brand summaries", async () => {
    const brandService = {
      listBrands: jest.fn().mockResolvedValue([nikeBrand, boschBrand]),
    }
    const scope: any = {
      resolve: jest.fn((key) =>
        key === Modules.BRAND ? brandService : null
      ),
    }

    const products: any[] = [
      { id: "prod_1", metadata: { brand_id: "brand_bosch" } },
      { id: "prod_2", metadata: { brand_slug: "NIKE" } },
      { id: "prod_3", metadata: { brand: "بوش" } },
      { id: "prod_4", metadata: {} },
    ]

    await enrichProductsWithBrand(scope, products)

    expect(brandService.listBrands).toHaveBeenCalledTimes(1)
    expect(products[0].brand).toEqual(boschBrand)
    expect(products[1].brand).toEqual(nikeBrand)
    expect(products[2].brand).toEqual(boschBrand)
    expect(products[3].brand).toBeNull()
  })

  it("sets product.brand to null gracefully when Modules.BRAND is not registered", async () => {
    const scope: any = {
      resolve: jest.fn(() => {
        throw new Error("Unregistered")
      }),
    }
    const products: any[] = [
      { id: "prod_1", metadata: { brand_id: "brand_bosch" } },
    ]

    await enrichProductsWithBrand(scope, products)

    expect(products[0].brand).toBeNull()
  })

  it("hydrates product.brand in GET /store/products", async () => {
    const brandService = {
      listBrands: jest.fn().mockResolvedValue([boschBrand]),
    }
    const graph = jest.fn().mockResolvedValue({
      data: [
        {
          id: "prod_1",
          title: "Drill",
          metadata: { brand_id: "brand_bosch" },
          variants: [
            {
              id: "var_1",
              manage_inventory: false,
              prices: [{ amount: 25000000, currency_code: "irr" }],
            },
          ],
        },
      ],
      metadata: { count: 1, skip: 0, take: 50 },
    })

    const req: any = {
      filterableFields: {},
      queryConfig: {
        fields: ["id", "title"],
        pagination: { skip: 0, take: 50 },
      },
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) return { graph }
          if (key === Modules.BRAND) return brandService
          throw new Error(`Unregistered: ${key}`)
        }),
      },
    }
    const json = jest.fn()
    const res: any = { json }

    await listStoreProducts(req, res)

    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.arrayContaining(["metadata"]),
      }),
      expect.any(Object)
    )
    expect(json.mock.calls[0][0].products[0].brand).toEqual(boschBrand)
  })

  it("hydrates product.brand in GET /store/products/:id", async () => {
    const brandService = {
      listBrands: jest.fn().mockResolvedValue([boschBrand]),
    }
    const graph = jest.fn().mockResolvedValue({
      data: [
        {
          id: "prod_1",
          title: "Drill",
          metadata: { brand_slug: "bosch" },
          variants: [],
        },
      ],
    })

    const req: any = {
      params: { id: "prod_1" },
      filterableFields: {},
      queryConfig: {
        fields: ["id", "title"],
      },
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) return { graph }
          if (key === Modules.BRAND) return brandService
          throw new Error(`Unregistered: ${key}`)
        }),
      },
    }
    const json = jest.fn()
    const res: any = { json }

    await getStoreProduct(req, res)

    expect(json.mock.calls[0][0].product.brand).toEqual(boschBrand)
  })

  it("hydrates product.brand in GET /admin/products and GET /admin/products/:id", async () => {
    const brandService = {
      listBrands: jest.fn().mockResolvedValue([boschBrand]),
    }
    const graph = jest.fn().mockResolvedValue({
      data: [
        {
          id: "prod_1",
          title: "Drill",
          metadata: { brand_id: "brand_bosch" },
          variants: [],
        },
      ],
      metadata: { count: 1, skip: 0, take: 50 },
    })

    const scope = {
      resolve: jest.fn((key: string) => {
        if (key === ContainerRegistrationKeys.QUERY) return { graph }
        if (key === Modules.BRAND) return brandService
        throw new Error(`Unregistered: ${key}`)
      }),
    }

    const listReq: any = {
      filterableFields: {},
      queryConfig: {
        fields: ["id", "title"],
        pagination: { skip: 0, take: 50 },
      },
      scope,
    }
    const listJson = jest.fn()
    await listAdminProducts(listReq, { json: listJson } as any)
    expect(listJson.mock.calls[0][0].products[0].brand).toEqual(boschBrand)

    graph.mockResolvedValueOnce({
      data: [
        {
          id: "prod_1",
          title: "Drill",
          metadata: { brand_id: "brand_bosch" },
          variants: [],
        },
      ],
      metadata: { count: 1, skip: 0, take: 1 },
    })
    const getReq: any = {
      params: { id: "prod_1" },
      queryConfig: { fields: ["id", "title"] },
      scope,
    }
    const getJson = jest.fn()
    const getStatus = jest.fn().mockReturnThis()
    await getAdminProduct(getReq, { status: getStatus, json: getJson } as any)
    expect(getStatus).toHaveBeenCalledWith(200)
    expect(getJson.mock.calls[0][0].product.brand).toEqual(boschBrand)
  })
})
