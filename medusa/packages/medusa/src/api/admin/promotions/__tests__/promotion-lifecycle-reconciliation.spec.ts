import { refreshCartItemsWorkflowId } from "@medusajs/core-flows"
import {
  ContainerRegistrationKeys,
  createMedusaContainer,
  MedusaError,
  Modules,
  PriceListType,
  PromotionActions,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  getPromotionCodesToApply,
  isPromotionCurrentlyActive,
} from "../../../../../../core/core-flows/src/cart/steps/get-promotion-codes-to-apply"
import { prepareLineItemData } from "../../../../../../core/core-flows/src/cart/utils/prepare-line-item-data"
import { GET as getStoreCart } from "../../../store/carts/[id]/route"
import { reconcileStaleCartPromotions } from "../../../store/carts/helpers"
import { hasProductDiscount } from "../../../store/products/catalog-filters"
import {
  applyActiveAutomaticPromotionsToProducts,
  enrichProductsWithStoreSummary,
} from "../../../store/products/helpers"
import { DELETE as deletePromotion, PATCH as patchPromotion } from "../[id]/route"
import { reconcileCartsForPromotionChange } from "../reconcile-carts"

const mockUpdatePromotionsRun = jest.fn().mockResolvedValue({ result: [] })
const mockDeletePromotionsRun = jest.fn().mockResolvedValue({ result: [] })

jest.mock("@medusajs/core-flows", () => {
  const actual = jest.requireActual("@medusajs/core-flows")
  return {
    ...actual,
    updatePromotionsWorkflow: jest.fn(() => ({ run: mockUpdatePromotionsRun })),
    deletePromotionsWorkflow: jest.fn(() => ({ run: mockDeletePromotionsRun })),
  }
})

const testGetPromoCodesWorkflow = createWorkflow(
  "test-get-promotion-codes-to-apply",
  (input: any) => {
    const result = getPromotionCodesToApply(input)
    return new WorkflowResponse(result)
  }
)

describe("Promotion lifecycle, open-cart reconciliation, storefront pricing & PriceList cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getPromotionCodesToApply & isPromotionCurrentlyActive", () => {
    const makeContainer = (promotions: any[]) => {
      const graph = jest.fn().mockResolvedValue({ data: promotions })
      const container = createMedusaContainer()
      container.register(ContainerRegistrationKeys.QUERY, {
        resolve: () => ({ graph }),
      })
      return { graph, container }
    }

    it("rejects inactive, draft, soft-deleted, expired, future, and inactive-campaign promotions", () => {
      const now = Date.now()
      expect(
        isPromotionCurrentlyActive({ id: "p1", status: "active" }, now)
      ).toBe(true)
      expect(
        isPromotionCurrentlyActive({ id: "p2", status: "inactive" }, now)
      ).toBe(false)
      expect(
        isPromotionCurrentlyActive({ id: "p3", status: "draft" }, now)
      ).toBe(false)
      expect(
        isPromotionCurrentlyActive(
          { id: "p4", status: "active", deleted_at: "2026-01-01T00:00:00Z" },
          now
        )
      ).toBe(false)
      expect(
        isPromotionCurrentlyActive(
          {
            id: "p5",
            status: "active",
            metadata: { ends_at: new Date(now - 60_000).toISOString() },
          },
          now
        )
      ).toBe(false)
      expect(
        isPromotionCurrentlyActive(
          {
            id: "p6",
            status: "active",
            metadata: { starts_at: new Date(now + 60_000).toISOString() },
          },
          now
        )
      ).toBe(false)
      expect(
        isPromotionCurrentlyActive(
          {
            id: "p7",
            status: "active",
            campaign: { metadata: { is_active: false } },
          },
          now
        )
      ).toBe(false)
    })

    it("rejects inactive/draft/expired/inactive-campaign promo codes without using stale cache", async () => {
      for (const promo of [
        { id: "p_inactive", code: "OFF10", status: "inactive" },
        { id: "p_draft", code: "OFF10", status: "draft" },
        {
          id: "p_expired",
          code: "OFF10",
          status: "active",
          metadata: { ends_at: new Date(Date.now() - 10_000).toISOString() },
        },
        {
          id: "p_camp_off",
          code: "OFF10",
          status: "active",
          campaign: { metadata: { is_active: false } },
        },
      ]) {
        const { container, graph } = makeContainer([promo])
        await expect(
          testGetPromoCodesWorkflow(container).run({
            input: {
              cart: { items: [], shipping_methods: [] },
              promo_codes: ["OFF10"],
              action: PromotionActions.ADD,
            },
          })
        ).rejects.toMatchObject({
          type: MedusaError.Types.INVALID_DATA,
          message: expect.stringMatching(/inactive or expired/i),
        })

        // Ensure query.graph did NOT pass cache: { enable: true }
        expect(graph.mock.calls[0][1]).toBeUndefined()
      }
    })

    it("accepts active in-window promotions and reads fresh uncached promotion records", async () => {
      const { container, graph } = makeContainer([
        {
          id: "p_ok",
          code: "LIVE20",
          status: "active",
          deleted_at: null,
          metadata: {
            starts_at: new Date(Date.now() - 60_000).toISOString(),
            ends_at: new Date(Date.now() + 60_000).toISOString(),
          },
          campaign: { metadata: { is_active: true } },
        },
      ])

      const { result } = await testGetPromoCodesWorkflow(container).run({
        input: {
          cart: { items: [], shipping_methods: [] },
          promo_codes: ["LIVE20"],
          action: PromotionActions.ADD,
        },
      })

      expect(result).toEqual(["LIVE20"])
      expect(graph).toHaveBeenCalledTimes(1)
      expect(graph.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe("Admin PATCH & DELETE promotion reconciliation + fallback cleanup", () => {
    const makeRes = () => {
      const json = jest.fn()
      const status = jest.fn().mockReturnValue({ json })
      return { res: { json, status } as any, json, status }
    }

    it("PATCH /admin/promotions/:id {status:'inactive'} clears cache and refreshes open carts (skipping completed)", async () => {
      const clearCache = jest.fn().mockResolvedValue(undefined)
      const wfRun = jest.fn().mockResolvedValue({ result: {} })

      const cartsDb = [
        {
          id: "cart_open_1",
          completed_at: null,
          promotions: [{ id: "promo_1", code: "DEACT20" }],
          items: [],
          shipping_methods: [],
        },
        {
          id: "cart_completed_1",
          completed_at: "2026-11-28T00:00:00Z",
          promotions: [{ id: "promo_1", code: "DEACT20" }],
          items: [],
          shipping_methods: [],
        },
      ]

      let patchCallCount = 0
      const remoteQuery = jest.fn().mockImplementation((q: any) => {
        const entryPoint = Object.keys(q?.__value ?? {})[0]
        if (entryPoint === "promotion") {
          patchCallCount++
          return Promise.resolve([
            {
              id: "promo_1",
              code: "DEACT20",
              status: patchCallCount === 1 ? "active" : "inactive",
              metadata: {},
            },
          ])
        }
        if (entryPoint === "cart_promotion") {
          return Promise.resolve([
            { cart_id: "cart_open_1", promotion_id: "promo_1" },
            { cart_id: "cart_completed_1", promotion_id: "promo_1" },
          ])
        }
        if (entryPoint === "cart") {
          return Promise.resolve(cartsDb)
        }
        return Promise.resolve([])
      })

      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
          if (key === Modules.CACHING) return { clear: clearCache }
          if (key === Modules.WORKFLOW_ENGINE) return { run: wfRun }
          return null
        }),
      }

      const { res, json, status } = makeRes()
      await patchPromotion(
        {
          params: { id: "promo_1" },
          validatedBody: { status: "inactive" },
          queryConfig: { fields: ["id", "code", "status"] },
          scope,
        } as any,
        res
      )

      expect(status).toHaveBeenCalledWith(200)
      expect(json.mock.calls[0][0].promotion.status).toBe("inactive")
      expect(clearCache).toHaveBeenCalledWith({
        tags: expect.arrayContaining([
          "promotion",
          "product",
          "product_variant",
          "price_list",
        ]),
      })
      expect(wfRun).toHaveBeenCalledTimes(1)
      expect(wfRun).toHaveBeenCalledWith(refreshCartItemsWorkflowId, {
        input: { cart_id: "cart_open_1", force_refresh: false },
      })
    })

    it("DELETE /admin/promotions/:id reconciles open carts and falls back to deleting adjustments & links without workflow engine", async () => {
      const clearCache = jest.fn().mockResolvedValue(undefined)
      const deleteLineItemAdjustments = jest.fn().mockResolvedValue(undefined)
      const deleteShippingMethodAdjustments = jest
        .fn()
        .mockResolvedValue(undefined)
      const dismissLinks = jest.fn().mockResolvedValue(undefined)

      const openCart = {
        id: "cart_open_del",
        completed_at: null,
        promotions: [{ id: "promo_del", code: "DEL50" }],
        items: [
          {
            id: "li_1",
            adjustments: [
              { id: "adj_li_1", promotion_id: "promo_del", code: "DEL50" },
              { id: "adj_keep", promotion_id: "promo_other", code: "KEEP10" },
            ],
          },
        ],
        shipping_methods: [
          {
            id: "sm_1",
            adjustments: [
              { id: "adj_sm_1", promotion_id: "promo_del", code: "DEL50" },
            ],
          },
        ],
      }

      const remoteQuery = jest.fn().mockImplementation((q: any) => {
        const entryPoint = Object.keys(q?.__value ?? {})[0]
        if (entryPoint === "promotion") {
          return Promise.resolve([{ id: "promo_del", code: "DEL50" }])
        }
        if (entryPoint === "cart") {
          return Promise.resolve([openCart])
        }
        return Promise.resolve([])
      })

      const cartService = {
        retrieveCart: jest.fn().mockResolvedValue(openCart),
        listLineItemAdjustments: jest.fn().mockResolvedValue([]),
        listShippingMethodAdjustments: jest.fn().mockResolvedValue([]),
        deleteLineItemAdjustments,
        deleteShippingMethodAdjustments,
      }

      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
          if (key === Modules.CACHING) return { clear: clearCache }
          if (key === Modules.CART) return cartService
          if (key === ContainerRegistrationKeys.LINK) {
            return { dismiss: dismissLinks }
          }
          return null
        }),
      }

      const { res, status, json } = makeRes()
      await deletePromotion(
        {
          params: { id: "promo_del" },
          scope,
        } as any,
        res
      )

      expect(mockDeletePromotionsRun).toHaveBeenCalledWith({
        input: { ids: ["promo_del"] },
      })
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        id: "promo_del",
        object: "promotion",
        deleted: true,
      })
      expect(clearCache).toHaveBeenCalled()
      expect(deleteLineItemAdjustments).toHaveBeenCalledWith(["adj_li_1"])
      expect(deleteShippingMethodAdjustments).toHaveBeenCalledWith(["adj_sm_1"])
      expect(dismissLinks).toHaveBeenCalledWith([
        {
          [Modules.CART]: { cart_id: "cart_open_del" },
          [Modules.PROMOTION]: { promotion_id: "promo_del" },
        },
      ])

      // Direct unit check on empty inputs returns [] safely
      const empty = await reconcileCartsForPromotionChange(scope as any, {})
      expect(empty).toEqual([])
    })
  })

  describe("Store GET /store/carts/:id self-healing", () => {
    it("refreshes open cart when referenced promotion was deactivated or deleted and returns clean cart", async () => {
      let cartState = {
        id: "cart_heal_1",
        completed_at: null,
        discount_total: 2000000,
        total: 8000000,
        promotions: [{ id: "promo_dead", code: "DEAD20", status: "inactive" }],
        items: [
          {
            id: "li_1",
            variant_id: "var_1",
            unit_price: 10000000,
            adjustments: [
              { id: "adj_1", promotion_id: "promo_dead", code: "DEAD20" },
            ],
            variant: { id: "var_1", manage_inventory: false },
          },
        ],
        shipping_methods: [],
      }

      const wfRun = jest.fn().mockImplementation(async (wfId: string) => {
        if (wfId === refreshCartItemsWorkflowId) {
          cartState = {
            ...cartState,
            discount_total: 0,
            total: 10000000,
            promotions: [],
            items: [
              {
                ...cartState.items[0],
                adjustments: [],
              },
            ],
          }
        }
        return { result: cartState }
      })

      const remoteQuery = jest.fn().mockImplementation((q: any) => {
        const entryPoint = Object.keys(q?.__value ?? {})[0]
        if (entryPoint === "cart") {
          return Promise.resolve([cartState])
        }
        if (entryPoint === "promotion") {
          return Promise.resolve([
            { id: "promo_dead", code: "DEAD20", status: "inactive" },
          ])
        }
        return Promise.resolve([])
      })

      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
          if (key === Modules.WORKFLOW_ENGINE) return { run: wfRun }
          return null
        }),
      }

      const json = jest.fn()
      await getStoreCart(
        {
          params: { id: "cart_heal_1" },
          queryConfig: { fields: ["id", "discount_total", "promotions.id"] },
          scope,
        } as any,
        { json } as any
      )

      expect(wfRun).toHaveBeenCalledWith(refreshCartItemsWorkflowId, {
        input: { cart_id: "cart_heal_1", force_refresh: true },
      })
      const returnedCart = json.mock.calls[0][0].cart
      expect(returnedCart.discount_total).toBe(0)
      expect(returnedCart.total).toBe(10000000)
      expect(returnedCart.promotions).toEqual([])
    })

    it("does NOT trigger refresh when all cart promotions are active", async () => {
      const wfRun = jest.fn()
      const remoteQuery = jest.fn().mockImplementation((q: any) => {
        if (Object.keys(q?.__value ?? {})[0] === "promotion") {
          return Promise.resolve([
            {
              id: "promo_live",
              code: "LIVE15",
              status: "active",
              deleted_at: null,
              metadata: {},
            },
          ])
        }
        return Promise.resolve([])
      })

      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
          if (key === Modules.WORKFLOW_ENGINE) return { run: wfRun }
          return null
        }),
      }

      const reconciled = await reconcileStaleCartPromotions(scope as any, {
        id: "cart_live",
        completed_at: null,
        promotions: [{ id: "promo_live", code: "LIVE15", status: "active" }],
        items: [],
        shipping_methods: [],
      })

      expect(reconciled).toBe(false)
      expect(wfRun).not.toHaveBeenCalled()
    })
  })

  describe("Storefront product automatic promotions, cloning & compare_at_price guards", () => {
    it("excludes inactive, deleted, expired, inactive-campaign, buyget, and shipping automatic promos; clones variant.calculated_price", async () => {
      const now = Date.now()
      const remoteQuery = jest.fn().mockResolvedValue([
        {
          id: "p_inactive",
          code: "INACT",
          type: "standard",
          status: "inactive",
          is_automatic: true,
          application_method: {
            type: "percentage",
            value: 50,
            target_type: "items",
          },
        },
        {
          id: "p_deleted",
          code: "DEL",
          type: "standard",
          status: "active",
          deleted_at: new Date().toISOString(),
          is_automatic: true,
          application_method: {
            type: "percentage",
            value: 50,
            target_type: "items",
          },
        },
        {
          id: "p_expired",
          code: "EXP",
          type: "standard",
          status: "active",
          is_automatic: true,
          metadata: { ends_at: new Date(now - 5000).toISOString() },
          application_method: {
            type: "percentage",
            value: 50,
            target_type: "items",
          },
        },
        {
          id: "p_camp_off",
          code: "CAMPOFF",
          type: "standard",
          status: "active",
          is_automatic: true,
          campaign: { metadata: { is_active: false } },
          application_method: {
            type: "percentage",
            value: 50,
            target_type: "items",
          },
        },
        {
          id: "p_buyget",
          code: "BG",
          type: "buyget",
          status: "active",
          is_automatic: true,
          application_method: {
            type: "percentage",
            value: 50,
            target_type: "items",
          },
        },
        {
          id: "p_ship",
          code: "FREESHIP",
          type: "standard",
          status: "active",
          is_automatic: true,
          application_method: {
            type: "percentage",
            value: 100,
            target_type: "shipping_methods",
          },
        },
        {
          id: "p_active",
          code: "REAL10",
          type: "standard",
          status: "active",
          is_automatic: true,
          application_method: {
            type: "percentage",
            value: 10,
            target_type: "items",
          },
        },
      ])

      const scope = {
        resolve: jest.fn((key: string) =>
          key === ContainerRegistrationKeys.REMOTE_QUERY ? remoteQuery : null
        ),
      } as any

      const sharedCalculatedPrice = {
        original_amount: 10000000,
        calculated_amount: 10000000,
      }

      const product = {
        id: "prod_clone_test",
        realPrice: 10000000,
        finalPrice: 10000000,
        discount: 0,
        variants: [{ id: "var_1", calculated_price: sharedCalculatedPrice }],
      }

      await applyActiveAutomaticPromotionsToProducts(scope, [product])

      // Only REAL10 (10%) must apply; 50%/100% invalid/shipping promos must be ignored
      expect(product.realPrice).toBe(10000000)
      expect(product.finalPrice).toBe(9000000)
      expect(product.discount).toBe(10)

      // Must replace calculated_price with a new object instead of mutating sharedCalculatedPrice
      expect(product.variants[0].calculated_price).not.toBe(
        sharedCalculatedPrice
      )
      expect(product.variants[0].calculated_price.calculated_amount).toBe(
        9000000
      )
      expect(sharedCalculatedPrice.calculated_amount).toBe(10000000)
    })

    it("ignores variant.metadata.compare_at_price <= finalPrice and evaluates hasProductDiscount accurately", () => {
      const equalCompareProduct: any = {
        id: "prod_eq",
        variants: [
          {
            id: "v1",
            prices: [{ amount: 5000000, currency_code: "irr" }],
            metadata: { compare_at_price: 4000000 },
          },
        ],
      }

      enrichProductsWithStoreSummary([equalCompareProduct])
      expect(equalCompareProduct.realPrice).toBe(5000000)
      expect(equalCompareProduct.finalPrice).toBe(5000000)
      expect(equalCompareProduct.discount).toBe(0)
      expect(hasProductDiscount(equalCompareProduct)).toBe(false)

      const discountedViaMeta: any = {
        id: "prod_meta_disc",
        variants: [
          {
            id: "v2",
            prices: [{ amount: 4000000, currency_code: "irr" }],
            metadata: { compare_at_price: 5000000 },
          },
        ],
      }
      enrichProductsWithStoreSummary([discountedViaMeta])
      expect(discountedViaMeta.discount).toBe(20)
      expect(hasProductDiscount(discountedViaMeta)).toBe(true)
    })
  })

  describe("prepareLineItemData stale compare_at_unit_price cleanup", () => {
    it("sets compare_at_unit_price for active Sale PriceList and clears it to null when variant leaves Sale PriceList", () => {
      const salePrepared = prepareLineItemData({
        item: { quantity: 1 },
        variant: {
          id: "var_1",
          title: "V1",
          product: { id: "prod_1", title: "P1", is_giftcard: false } as any,
          inventory_items: [],
          calculated_price: {
            calculated_price: { price_list_type: PriceListType.SALE },
            is_calculated_price_tax_inclusive: false,
            original_amount: 12000000,
            calculated_amount: 9000000,
          },
        } as any,
        unitPrice: 9000000,
        isTaxInclusive: false,
        isCustomPrice: false,
      })

      expect(salePrepared.compare_at_unit_price).toBe(12000000)

      const clearedPrepared = prepareLineItemData({
        item: {
          quantity: 1,
          compare_at_unit_price: 12000000,
        },
        variant: {
          id: "var_1",
          title: "V1",
          product: { id: "prod_1", title: "P1", is_giftcard: false } as any,
          inventory_items: [],
          calculated_price: {
            calculated_price: { price_list_type: "default" },
            is_calculated_price_tax_inclusive: false,
            original_amount: 12000000,
            calculated_amount: 12000000,
          },
        } as any,
        unitPrice: 12000000,
        isTaxInclusive: false,
        isCustomPrice: false,
      })

      expect(clearedPrepared.compare_at_unit_price).toBeNull()
    })
  })
})
