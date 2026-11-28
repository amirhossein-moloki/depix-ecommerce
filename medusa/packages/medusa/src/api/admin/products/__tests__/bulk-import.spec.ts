import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const mockCreateProductsRun = jest.fn()
const mockUpdateProductsRun = jest.fn()
const mockCreateVariantsRun = jest.fn()
const mockUpdateVariantsRun = jest.fn()
const mockCreateOptionsRun = jest.fn()
const mockUpdateOptionsRun = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  ...jest.requireActual("@medusajs/core-flows"),
  createProductsWorkflow: jest.fn(() => ({ run: mockCreateProductsRun })),
  updateProductsWorkflow: jest.fn(() => ({ run: mockUpdateProductsRun })),
  createProductVariantsWorkflow: jest.fn(() => ({ run: mockCreateVariantsRun })),
  updateProductVariantsWorkflow: jest.fn(() => ({ run: mockUpdateVariantsRun })),
  createProductOptionsWorkflow: jest.fn(() => ({ run: mockCreateOptionsRun })),
  updateProductOptionsWorkflow: jest.fn(() => ({ run: mockUpdateOptionsRun })),
}))

const mockEnsureDefaultInventory = jest.fn()
jest.mock("../utils/ensure-default-inventory", () => ({
  ensureProductDefaultInventoryAndChannel: (...args: any[]) =>
    mockEnsureDefaultInventory(...args),
}))

const mockAdjustVariantInventory = jest.fn()
jest.mock("../../inventory/utils/adjust-variant-inventory", () => ({
  adjustVariantInventory: (...args: any[]) =>
    mockAdjustVariantInventory(...args),
}))

import { POST as bulkImportHandler } from "../bulk-import/route"
import { AdminBulkImportProducts } from "../bulk-import/validators"

describe("POST /admin/products/bulk-import", () => {
  let categoriesDb: any[]
  let brandsDb: any[]
  let productsDb: any[]
  let mockProductService: any
  let mockBrandService: any
  let mockQuery: any
  let req: any
  let res: any
  let idCounter: number

  beforeEach(() => {
    jest.clearAllMocks()
    idCounter = 1
    categoriesDb = []
    brandsDb = []
    productsDb = []

    mockProductService = {
      retrieveProductCategory: jest.fn(async (id: string) => {
        const found = categoriesDb.find((c) => c.id === id)
        if (!found) throw new Error("Not found")
        return found
      }),
      listProductCategories: jest.fn(async (filter: any) => {
        if (filter?.handle) {
          return categoriesDb.filter((c) => c.handle === filter.handle)
        }
        return categoriesDb
      }),
      createProductCategories: jest.fn(async (data: any) => {
        const created = { id: `pcat_${idCounter++}`, ...data }
        categoriesDb.push(created)
        return created
      }),
    }

    mockBrandService = {
      retrieveBrand: jest.fn(async (id: string) => {
        const found = brandsDb.find((b) => b.id === id)
        if (!found) throw new Error("Not found")
        return found
      }),
      listBrands: jest.fn(async (filter: any) => {
        if (filter?.slug) {
          return brandsDb.filter((b) => b.slug === filter.slug)
        }
        return brandsDb
      }),
      createBrands: jest.fn(async (data: any) => {
        const created = { id: `brand_${idCounter++}`, ...data }
        brandsDb.push(created)
        return created
      }),
    }

    mockQuery = {
      graph: jest.fn(async ({ entity, filters }: any) => {
        if (entity === "product" && filters?.handle) {
          return {
            data: productsDb.filter((p) => p.handle === filters.handle),
          }
        }
        if (entity === "product_variant" && filters?.sku) {
          const skuList = Array.isArray(filters.sku)
            ? filters.sku
            : [filters.sku]
          const matches: any[] = []
          for (const p of productsDb) {
            for (const v of p.variants ?? []) {
              if (v.sku && skuList.includes(v.sku)) {
                matches.push({ id: v.id, sku: v.sku, product_id: p.id })
              }
            }
          }
          return { data: matches }
        }
        return { data: [] }
      }),
    }

    mockCreateProductsRun.mockImplementation(async ({ input }: any) => {
      const created = input.products.map((p: any) => {
        const prodId = `prod_${idCounter++}`
        const optIdsByTitle = new Map<string, string>()
        const options = (p.options ?? []).map((o: any) => {
          const optId = `opt_${idCounter++}`
          optIdsByTitle.set(o.title, optId)
          return {
            id: optId,
            title: o.title,
            values: (o.values ?? []).map((val: string) => ({ value: val })),
          }
        })
        const variants = (p.variants ?? []).map((v: any) => ({
          id: `var_${idCounter++}`,
          title: v.title,
          sku: v.sku,
          manage_inventory: v.manage_inventory,
          metadata: v.metadata,
          prices: v.prices,
          options: Object.entries(v.options ?? {}).map(([k, val]) => ({
            option_id: optIdsByTitle.get(k),
            option: { title: k },
            value: val,
          })),
        }))
        const stored = {
          id: prodId,
          ...p,
          options,
          variants,
        }
        productsDb.push(stored)
        return stored
      })
      return { result: created }
    })

    mockUpdateProductsRun.mockImplementation(async ({ input }: any) => {
      const prod = productsDb.find((p) => p.id === input.selector.id)
      if (prod) {
        Object.assign(prod, input.update)
      }
      return { result: prod ? [prod] : [] }
    })

    mockUpdateOptionsRun.mockImplementation(async ({ input }: any) => {
      for (const prod of productsDb) {
        const opt = (prod.options ?? []).find(
          (o: any) => o.id === input.selector.id
        )
        if (opt) {
          opt.values = (input.update.values ?? []).map((v: string) => ({
            value: v,
          }))
        }
      }
      return { result: [] }
    })

    mockCreateOptionsRun.mockImplementation(async ({ input }: any) => {
      for (const optInput of input.product_options ?? []) {
        const prod = productsDb.find((p) => p.id === optInput.product_id)
        if (prod) {
          prod.options.push({
            id: `opt_${idCounter++}`,
            title: optInput.title,
            values: (optInput.values ?? []).map((v: string) => ({ value: v })),
          })
        }
      }
      return { result: [] }
    })

    mockUpdateVariantsRun.mockImplementation(async ({ input }: any) => {
      for (const vUpdate of input.product_variants ?? []) {
        for (const prod of productsDb) {
          const v = (prod.variants ?? []).find((x: any) => x.id === vUpdate.id)
          if (v) {
            Object.assign(v, {
              title: vUpdate.title,
              sku: vUpdate.sku ?? v.sku,
              prices: vUpdate.prices,
              metadata: vUpdate.metadata,
            })
          }
        }
      }
      return { result: [] }
    })

    mockCreateVariantsRun.mockImplementation(async ({ input }: any) => {
      for (const vCreate of input.product_variants ?? []) {
        const prod = productsDb.find((p) => p.id === vCreate.product_id)
        if (prod) {
          prod.variants.push({
            id: `var_${idCounter++}`,
            ...vCreate,
            options: Object.entries(vCreate.options ?? {}).map(([k, val]) => ({
              option: { title: k },
              value: val,
            })),
          })
        }
      }
      return { result: [] }
    })

    mockEnsureDefaultInventory.mockResolvedValue(undefined)
    mockAdjustVariantInventory.mockResolvedValue({ success: true })

    req = {
      auth_context: { actor_id: "usr_admin" },
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) return mockQuery
          if (key === Modules.PRODUCT) return mockProductService
          if (key === Modules.BRAND) return mockBrandService
          return null
        }),
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe("AdminBulkImportProducts validator", () => {
    it("applies default mode, dry_run, price_unit, and download_images", () => {
      const parsed = AdminBulkImportProducts.parse({
        products: [{ title: "دریل ساده", price_irr: 15000000 }],
      })

      expect(parsed.mode).toBe("upsert")
      expect(parsed.dry_run).toBe(false)
      expect(parsed.price_unit).toBe("irr")
      expect(parsed.download_images).toBe(false)
      expect(parsed.products[0].status).toBe("published")
    })

    it("rejects empty products array or negative prices", () => {
      expect(() =>
        AdminBulkImportProducts.parse({ products: [] })
      ).toThrow()

      expect(() =>
        AdminBulkImportProducts.parse({
          products: [
            {
              title: "Invalid",
              variants: [{ price_irr: -100 }],
            },
          ],
        })
      ).toThrow()
    })
  })

  it("imports a simple product and provisions default option, sales channel, and inventory", async () => {
    req.validatedBody = AdminBulkImportProducts.parse({
      products: [
        {
          title: "پیچگوشتی برقی رونیکس",
          handle: "ronix-electric-screwdriver",
          price_irr: 12000000,
          compare_at_price_irr: 14000000,
          stock: 8,
          sku: "RNX-SCR-01",
          images: ["https://cdn.example.com/screwdriver.webp"],
        },
      ],
    })

    await bulkImportHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.summary).toEqual({
      total: 1,
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 0,
      categories_created: 0,
      brands_created: 0,
    })
    expect(body.results[0]).toMatchObject({
      status: "created",
      handle: "ronix-electric-screwdriver",
      variants_created: 1,
    })

    const createInput = mockCreateProductsRun.mock.calls[0][0].input.products[0]
    expect(createInput.options).toEqual([
      { title: "نوع", values: ["استاندارد"] },
    ])
    expect(createInput.thumbnail).toBe(
      "https://cdn.example.com/screwdriver.webp"
    )
    expect(createInput.variants[0]).toMatchObject({
      sku: "RNX-SCR-01",
      prices: [{ amount: 12000000, currency_code: "irr" }],
      options: { نوع: "استاندارد" },
      metadata: {
        initial_stock: 8,
        compare_at_price: 14000000,
      },
    })
    expect(mockEnsureDefaultInventory).toHaveBeenCalledWith(
      req.scope,
      body.results[0].product_id
    )
  })

  it("imports multi-variant product with parent-child category & brand find-or-create and Toman->IRR conversion", async () => {
    req.validatedBody = AdminBulkImportProducts.parse({
      price_unit: "irt",
      products: [
        {
          title: "دریل چکشی ۱۳ میلیمتری بوش",
          handle: "bosch-gsb-13-re",
          category: {
            slug: "impact-drills",
            name: "دریل چکشی",
            parent_slug: "power-tools",
            parent_name: "ابزارآلات برقی",
          },
          brand: {
            slug: "bosch",
            name: "بوش",
          },
          tags: ["دریل", "ابزار برقی"],
          specifications: [{ label: "توان", value: "۶۰۰ وات" }],
          color_hex_map: { مشکی: "#111827", آبی: "#2563EB" },
          options: [{ title: "رنگ", values: ["مشکی", "آبی"] }],
          variants: [
            {
              title: "دریل بوش - مشکی",
              sku: "BOSCH-BLK",
              price_irr: 2500000, // Tomans -> 25,000,000 IRR
              compare_at_price_irr: 2800000, // Tomans -> 28,000,000 IRR
              stock: 10,
              options: { رنگ: "مشکی" },
            },
            {
              title: "دریل بوش - آبی",
              sku: "BOSCH-BLU",
              price_irr: 2650000,
              stock: 5,
              options: { رنگ: "آبی" },
            },
          ],
        },
        {
          title: "فرز مینی بوش",
          handle: "bosch-mini-grinder",
          category: {
            slug: "power-tools",
            name: "ابزارآلات برقی",
            description: "ابزار برقی صنعتی",
          },
          brand: {
            slug: "bosch",
            name: "بوش",
          },
          price_irr: 1800000,
          stock: 4,
          sku: "BOSCH-GRD",
        },
      ],
    })

    await bulkImportHandler(req, res)

    const body = res.json.mock.calls[0][0]
    expect(body.summary).toEqual({
      total: 2,
      created: 2,
      updated: 0,
      skipped: 0,
      failed: 0,
      categories_created: 2,
      brands_created: 1,
    })

    // Parent category created before child category using rich parent definition from item 2
    const parentCat = categoriesDb.find((c) => c.handle === "power-tools")
    const childCat = categoriesDb.find((c) => c.handle === "impact-drills")
    expect(parentCat).toBeDefined()
    expect(parentCat.description).toBe("ابزار برقی صنعتی")
    expect(childCat.parent_category_id).toBe(parentCat.id)

    // Brand created only once for both products
    expect(brandsDb).toHaveLength(1)
    expect(brandsDb[0].slug).toBe("bosch")

    const drillInput = mockCreateProductsRun.mock.calls[0][0].input.products[0]
    expect(drillInput.metadata).toMatchObject({
      category_id: childCat.id,
      brand_id: brandsDb[0].id,
      brand_slug: "bosch",
      brand: "بوش",
      tags: ["دریل", "ابزار برقی"],
      specifications: [{ label: "توان", value: "۶۰۰ وات" }],
      color_hex_map: { مشکی: "#111827", آبی: "#2563EB" },
    })
    expect(drillInput.variants[0].prices[0]).toEqual({
      amount: 25000000,
      currency_code: "irr",
    })
    expect(drillInput.variants[0].metadata).toMatchObject({
      initial_stock: 10,
      compare_at_price: 28000000,
    })
  })

  it("upserts existing products without duplicates, updates Inventory Module stock, and adds new variants", async () => {
    // First run: create product with 1 variant
    req.validatedBody = AdminBulkImportProducts.parse({
      products: [
        {
          title: "دریل بوش",
          handle: "bosch-drill",
          brand: { slug: "bosch", name: "بوش" },
          options: [{ title: "رنگ", values: ["آبی"] }],
          variants: [
            {
              title: "دریل بوش - آبی",
              sku: "BOSCH-BLU",
              price_irr: 25000000,
              compare_at_price_irr: 27000000,
              stock: 5,
              options: { رنگ: "آبی" },
            },
          ],
        },
      ],
    })
    await bulkImportHandler(req, res)
    expect(productsDb).toHaveLength(1)
    const createdProdId = productsDb[0].id
    const existingBlueVarId = productsDb[0].variants[0].id

    jest.clearAllMocks()

    // Second run: same handle, updated price/stock for existing SKU + new SKU variant
    req.validatedBody = AdminBulkImportProducts.parse({
      mode: "upsert",
      products: [
        {
          title: "دریل بوش (ویرایش جدید)",
          handle: "bosch-drill",
          brand: { slug: "bosch", name: "بوش" },
          options: [{ title: "رنگ", values: ["آبی", "مشکی"] }],
          variants: [
            {
              title: "دریل بوش - آبی",
              sku: "BOSCH-BLU",
              price_irr: 26000000,
              compare_at_price_irr: 29000000,
              stock: 12,
              options: { رنگ: "آبی" },
            },
            {
              title: "دریل بوش - مشکی",
              sku: "BOSCH-BLK",
              price_irr: 26500000,
              stock: 7,
              options: { رنگ: "مشکی" },
            },
          ],
        },
      ],
    })

    await bulkImportHandler(req, res)

    const body = res.json.mock.calls[0][0]
    expect(body.summary).toEqual({
      total: 1,
      created: 0,
      updated: 1,
      skipped: 0,
      failed: 0,
      categories_created: 0,
      brands_created: 0,
    })
    expect(body.results[0]).toMatchObject({
      status: "updated",
      product_id: createdProdId,
      variants_updated: 1,
      variants_created: 1,
    })
    // Still only 1 product and 2 variants (no duplicates!)
    expect(productsDb).toHaveLength(1)
    expect(productsDb[0].variants).toHaveLength(2)

    expect(mockUpdateOptionsRun).toHaveBeenCalledTimes(1)
    expect(mockUpdateVariantsRun).toHaveBeenCalledWith({
      input: {
        product_variants: [
          expect.objectContaining({
            id: existingBlueVarId,
            sku: "BOSCH-BLU",
            prices: [{ amount: 26000000, currency_code: "irr" }],
            metadata: expect.objectContaining({
              initial_stock: 12,
              compare_at_price: 29000000,
            }),
          }),
        ],
      },
    })
    expect(mockAdjustVariantInventory).toHaveBeenCalledWith(
      req.scope,
      expect.objectContaining({
        product_id: createdProdId,
        variant_id: existingBlueVarId,
        quantity: 12,
        reason: "bulk_import",
        recordTransactionIfUnchanged: false,
      })
    )
    expect(mockCreateVariantsRun).toHaveBeenCalledTimes(1)
    expect(mockEnsureDefaultInventory).toHaveBeenCalledWith(
      req.scope,
      createdProdId
    )
  })

  it("validates without writing any records when dry_run=true and warns when download_images=true", async () => {
    productsDb.push({
      id: "prod_existing",
      handle: "existing-tool",
      title: "Existing Tool",
      options: [{ id: "opt_1", title: "نوع", values: [{ value: "استاندارد" }] }],
      variants: [{ id: "var_1", sku: "EXIST-1", options: [] }],
      metadata: {},
    })

    req.validatedBody = AdminBulkImportProducts.parse({
      dry_run: true,
      mode: "upsert",
      download_images: true,
      products: [
        {
          title: "New Tool",
          handle: "new-tool",
          category: { slug: "hand-tools", name: "ابزار دستی" },
          brand: { slug: "stanley", name: "استنلی" },
          price_irr: 5000000,
          stock: 3,
          sku: "NEW-1",
        },
        {
          title: "Existing Tool Updated",
          handle: "existing-tool",
          price_irr: 6000000,
          stock: 4,
          sku: "EXIST-1",
        },
      ],
    })

    await bulkImportHandler(req, res)

    const body = res.json.mock.calls[0][0]
    expect(body.dry_run).toBe(true)
    expect(body.warnings).toHaveLength(1)
    expect(body.summary).toEqual({
      total: 2,
      created: 1,
      updated: 1,
      skipped: 0,
      failed: 0,
      categories_created: 1,
      brands_created: 1,
    })
    expect(body.results[0].status).toBe("would_create")
    expect(body.results[1].status).toBe("would_update")

    expect(mockProductService.createProductCategories).not.toHaveBeenCalled()
    expect(mockBrandService.createBrands).not.toHaveBeenCalled()
    expect(mockCreateProductsRun).not.toHaveBeenCalled()
    expect(mockUpdateProductsRun).not.toHaveBeenCalled()
    expect(mockAdjustVariantInventory).not.toHaveBeenCalled()
    expect(mockEnsureDefaultInventory).not.toHaveBeenCalled()
  })

  it("respects skip and create_only modes and isolates intra-batch duplicate handles/SKUs", async () => {
    productsDb.push({
      id: "prod_existing",
      handle: "existing-tool",
      title: "Existing",
      options: [],
      variants: [{ id: "var_1", sku: "EXIST-1", options: [] }],
      metadata: {},
    })

    req.validatedBody = AdminBulkImportProducts.parse({
      mode: "skip",
      products: [
        {
          title: "Existing",
          handle: "existing-tool",
          price_irr: 1000000,
          sku: "EXIST-1",
        },
        {
          title: "First New",
          handle: "dup-handle",
          price_irr: 1000000,
          sku: "SKU-A",
        },
        {
          title: "Duplicate Handle",
          handle: "dup-handle",
          price_irr: 1000000,
          sku: "SKU-B",
        },
      ],
    })

    await bulkImportHandler(req, res)
    let body = res.json.mock.calls[0][0]
    expect(body.summary).toMatchObject({
      total: 3,
      created: 1,
      skipped: 1,
      failed: 1,
    })
    expect(body.results[0].status).toBe("skipped")
    expect(body.results[1].status).toBe("created")
    expect(body.results[2].status).toBe("failed")

    jest.clearAllMocks()

    req.validatedBody = AdminBulkImportProducts.parse({
      mode: "create_only",
      products: [
        {
          title: "Existing",
          handle: "existing-tool",
          price_irr: 1000000,
          sku: "EXIST-1",
        },
      ],
    })

    await bulkImportHandler(req, res)
    body = res.json.mock.calls[0][0]
    expect(body.summary.failed).toBe(1)
    expect(body.results[0].status).toBe("failed")
    expect(body.results[0].errors[0]).toContain("mode=create_only")
  })

  it("clears previously stored metadata.compare_at_price when upserting compare_at_price_irr: null", async () => {
    productsDb.push({
      id: "prod_clear_compare",
      handle: "clear-compare-product",
      title: "Clear Compare Product",
      options: [{ id: "opt_1", title: "نوع", values: [{ value: "استاندارد" }] }],
      variants: [
        {
          id: "var_clear_1",
          sku: "CLR-CMP-1",
          options: [{ option_id: "opt_1", value: "استاندارد" }],
          metadata: {
            initial_stock: 5,
            compare_at_price: 25000000,
          },
        },
      ],
      metadata: {},
    })

    req.validatedBody = AdminBulkImportProducts.parse({
      mode: "upsert",
      products: [
        {
          title: "Clear Compare Product",
          handle: "clear-compare-product",
          price_irr: 20000000,
          compare_at_price_irr: null,
          stock: 7,
          sku: "CLR-CMP-1",
        },
      ],
    })

    await bulkImportHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.results[0]).toMatchObject({
      status: "updated",
      variants_updated: 1,
    })

    expect(mockUpdateVariantsRun).toHaveBeenCalledWith({
      input: {
        product_variants: [
          expect.objectContaining({
            id: "var_clear_1",
            prices: [{ amount: 20000000, currency_code: "irr" }],
            metadata: expect.objectContaining({
              initial_stock: 7,
              compare_at_price: null,
            }),
          }),
        ],
      },
    })
  })
})
