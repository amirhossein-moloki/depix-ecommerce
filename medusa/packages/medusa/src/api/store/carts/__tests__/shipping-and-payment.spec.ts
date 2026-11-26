import { Modules } from "@medusajs/framework/utils"
import { POST as addShippingMethods } from "../[id]/shipping-methods/route"
import { POST as updateLineItem } from "../[id]/line-items/[line_id]/route"
import { initiateGatewayPayment } from "../../payments/gateway"

describe("Dynamic Postex/Tabriz Shipping & IRR Payment Consistency", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    delete process.env.ZARINPAL_MERCHANT_ID
    delete process.env.ZARINPAL_CALLBACK_URL
  })

  it("fetches Postex live quote in IRR and applies FreeShippingRule when eligible", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        shipping_prices: [{ total_price: 850000 }],
      }),
    })
    global.fetch = fetchMock as any

    const cartRecord: any = {
      id: "cart_postex_1",
      subtotal: 60000000,
      item_subtotal: 60000000,
      items: [
        {
          id: "item_1",
          product_id: "prod_1",
          quantity: 2,
          unit_price: 30000000,
          variant: { weight: 1000 },
        },
      ],
      shipping_methods: [],
      metadata: {},
    }

    const mockCartService = {
      retrieveCart: jest.fn().mockResolvedValue(cartRecord),
      addShippingMethods: jest.fn().mockImplementation(async (_id, methods) => {
        cartRecord.shipping_methods = methods
        cartRecord.shipping_total = methods[0].amount
        return methods
      }),
      deleteShippingMethods: jest.fn(),
      updateCarts: jest.fn(),
    }

    const mockPromotionService = {
      listFreeShippingRules: jest.fn().mockResolvedValue([]),
    }

    const mockRemoteQuery = jest.fn().mockResolvedValue([cartRecord])

    const scope: any = {
      resolve: jest.fn((key: string) => {
        if (key === Modules.CART) return mockCartService
        if (key === Modules.PROMOTION) return mockPromotionService
        if (key === "remoteQuery") return mockRemoteQuery
        return null
      }),
    }

    const req: any = {
      params: { id: "cart_postex_1" },
      validatedBody: {
        option_id: "postex_post",
        data: { to_city_code: 1 },
      },
      queryConfig: { fields: [] },
      scope,
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await addShippingMethods(req, res)

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.postex.ir/api/v1/shipping/quotes",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"to_city_code":1'),
      })
    )
    expect(mockCartService.addShippingMethods).toHaveBeenCalledWith(
      "cart_postex_1",
      [
        expect.objectContaining({
          shipping_option_id: "postex_post",
          amount: 850000,
        }),
      ]
    )
    expect(res.status).toHaveBeenCalledWith(200)

    // Now test with an active FreeShippingRule -> shipping_total becomes 0
    mockPromotionService.listFreeShippingRules.mockResolvedValueOnce([
      {
        is_active: true,
        scope: "store",
        min_purchase_amount: 50000000,
      },
    ])

    await addShippingMethods(req, res)

    expect(mockCartService.addShippingMethods).toHaveBeenLastCalledWith(
      "cart_postex_1",
      [
        expect.objectContaining({
          shipping_option_id: "postex_post",
          amount: 0,
          data: expect.objectContaining({
            quoted_amount_irr: 850000,
            is_free_shipping: true,
          }),
        }),
      ]
    )
  })

  it("sets shipping_total = 0 and stores pay-on-delivery metadata for tabriz_courier", async () => {
    const cartRecord: any = {
      id: "cart_tabriz_1",
      items: [{ id: "item_1", quantity: 1, unit_price: 10000000 }],
      shipping_methods: [],
      metadata: {},
    }

    const mockCartService = {
      retrieveCart: jest.fn().mockResolvedValue(cartRecord),
      addShippingMethods: jest.fn().mockResolvedValue([]),
      deleteShippingMethods: jest.fn(),
      updateCarts: jest.fn(),
    }

    const mockRemoteQuery = jest.fn().mockResolvedValue([cartRecord])

    const scope: any = {
      resolve: jest.fn((key: string) => {
        if (key === Modules.CART) return mockCartService
        if (key === "remoteQuery") return mockRemoteQuery
        return null
      }),
    }

    const req: any = {
      params: { id: "cart_tabriz_1" },
      validatedBody: {
        option_id: "tabriz_courier",
      },
      queryConfig: { fields: [] },
      scope,
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await addShippingMethods(req, res)

    expect(mockCartService.addShippingMethods).toHaveBeenCalledWith(
      "cart_tabriz_1",
      [
        expect.objectContaining({
          shipping_option_id: "tabriz_courier",
          amount: 0,
        }),
      ]
    )
    expect(mockCartService.updateCarts).toHaveBeenCalledWith("cart_tabriz_1", {
      metadata: expect.objectContaining({
        shipping_method_code: "tabriz_courier",
        shipping_payment_type: "pay_on_delivery",
        shipping_note: "هزینه ارسال متغیر - پرداخت در محل توسط مشتری",
      }),
    })
  })

  it("recalculates cart total deterministically in IRR and sends currency=IRR to Zarinpal", async () => {
    process.env.ZARINPAL_MERCHANT_ID = "merchant_test_123"
    process.env.ZARINPAL_CALLBACK_URL = "https://example.com/callback"

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { code: 100, authority: "A00000000000000000000000000012345678" },
      }),
    })
    global.fetch = fetchMock as any

    // Simulate a stale cart.total (300,000,000) while items actually have qty=2 * 300,000,000 IRR
    const staleCart = {
      id: "cart_pay_1",
      currency_code: "irr",
      total: 300000000,
      discount_total: 0,
      tax_total: 0,
      shipping_total: 850000,
      items: [
        {
          id: "item_1",
          quantity: 2,
          unit_price: 300000000,
        },
      ],
      shipping_methods: [{ id: "sm_1", amount: 850000 }],
      metadata: {},
    }

    const mockCartService = {
      retrieveCart: jest.fn().mockResolvedValue(staleCart),
      updateCarts: jest.fn(),
    }

    const scope: any = {
      resolve: jest.fn((key: string) => {
        if (key === Modules.CART) return mockCartService
        if (key === "remoteQuery") return async () => [staleCart]
        return null
      }),
    }

    const result = await initiateGatewayPayment(scope, {
      cartId: "cart_pay_1",
      provider: "zarinpal",
    })

    expect(result.amount_irr).toBe(600850000)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/pg/v4/payment/request.json"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"currency":"IRR"'),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"amount":600850000'),
      })
    )
  })

  it("returns full cart with subtotal and total from POST /store/carts/:id/line-items/:line_id", async () => {
    const updatedCart = {
      id: "cart_li_1",
      subtotal: 600000000,
      total: 600000000,
      items: [{ id: "li_1", quantity: 2, unit_price: 300000000 }],
    }

    const mockWorkflowEngine = { run: jest.fn().mockResolvedValue({}) }
    const mockRemoteQuery = jest.fn().mockResolvedValue([updatedCart])

    const req: any = {
      params: { id: "cart_li_1", line_id: "li_1" },
      validatedBody: { quantity: 2 },
      queryConfig: { fields: [] },
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === Modules.WORKFLOW_ENGINE) return mockWorkflowEngine
          if (key === "remoteQuery") return mockRemoteQuery
          return null
        }),
      },
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await updateLineItem(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ cart: updatedCart })
  })
})
