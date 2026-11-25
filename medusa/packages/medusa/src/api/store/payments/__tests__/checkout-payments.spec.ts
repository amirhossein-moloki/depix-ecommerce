import { Modules } from "@medusajs/framework/utils"
import { POST as initiatePayment } from "../initiate/route"
import { POST as verifyPayment } from "../verify/route"
import { POST as cartPaymentSession } from "../../carts/[id]/payment-sessions/route"
import { DELETE as removeCartPromo } from "../../carts/[id]/promotions/[code]/route"
import { StoreAddCartPromotions } from "../../carts/validators"

describe("Store Checkout, Promotions & Payment Gateway (HAD-20)", () => {
  const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    return { res: { json, status } as any, json, status }
  }

  it("validates StoreAddCartPromotions with either code or promo_codes", () => {
    expect(StoreAddCartPromotions.parse({ code: "NOROUZ10" })).toEqual({
      code: "NOROUZ10",
    })
    expect(
      StoreAddCartPromotions.parse({ promo_codes: ["NOROUZ10"] })
    ).toEqual({
      promo_codes: ["NOROUZ10"],
    })
    expect(() => StoreAddCartPromotions.parse({})).toThrow()
  })

  it("removes a promo code via DELETE /store/carts/:id/promotions/:code", async () => {
    const we = { run: jest.fn().mockResolvedValue({}) }
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [{ id: "cart_1", discount_total: 0 }],
      }),
    }
    const { res, status, json } = makeRes()

    await removeCartPromo(
      {
        params: { id: "cart_1", code: "NOROUZ10" },
        queryConfig: { fields: ["id", "discount_total"] },
        scope: {
          resolve: jest.fn((key: string) => {
            if (key === Modules.WORKFLOW_ENGINE) return we
            if (key === "query") return query
            throw new Error(`Unexpected ${key}`)
          }),
        },
      } as any,
      res
    )

    expect(we.run).toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      cart: expect.objectContaining({ id: "cart_1", discount_total: 0 }),
    })
  })

  it("initiates payment and verifies callback to complete order", async () => {
    const cart: any = {
      id: "cart_1",
      total: 25000000,
      email: "buyer@depix.ir",
      metadata: {},
    }
    const cartService = {
      retrieveCart: jest.fn().mockImplementation(() => Promise.resolve(cart)),
    }
    const we = {
      run: jest.fn().mockImplementation((_wfId: string, opts: any) => {
        if (opts?.input?.metadata?.payment_session) {
          cart.metadata.payment_session = opts.input.metadata.payment_session
          return Promise.resolve({})
        }
        return Promise.resolve({
          result: { id: "order_1", display_id: 1001, total: 25000000 },
        })
      }),
    }

    const resolve = jest.fn((key: string) => {
      if (key === Modules.CART) return cartService
      if (key === Modules.WORKFLOW_ENGINE) return we
      throw new Error(`Unexpected ${key}`)
    })

    // Initiate via /store/payments/initiate
    const { res: initRes, status: initStatus, json: initJson } = makeRes()
    await initiatePayment(
      {
        validatedBody: {
          cart_id: "cart_1",
          provider: "zarinpal",
          callback_url: "https://depix.ir/checkout/callback",
        },
        scope: { resolve },
      } as any,
      initRes
    )

    expect(initStatus).toHaveBeenCalledWith(200)
    const initPayload = initJson.mock.calls[0][0]
    expect(initPayload).toMatchObject({
      provider: "zarinpal",
      amount_irr: 25000000,
    })
    expect(initPayload.authority).toBeTruthy()
    expect(initPayload.redirect_url).toContain(initPayload.authority)

    // Initiate via /store/carts/:id/payment-sessions alias
    const { res: sessRes, status: sessStatus } = makeRes()
    await cartPaymentSession(
      {
        params: { id: "cart_1" },
        validatedBody: {
          provider: "zarinpal",
          callback_url: "https://depix.ir/checkout/callback",
        },
        scope: { resolve },
      } as any,
      sessRes
    )
    expect(sessStatus).toHaveBeenCalledWith(200)

    // Verify payment
    const { res: verRes, status: verStatus, json: verJson } = makeRes()
    await verifyPayment(
      {
        validatedBody: {
          cart_id: "cart_1",
          authority: cart.metadata.payment_session.authority,
          status: "OK",
        },
        scope: { resolve },
      } as any,
      verRes
    )

    expect(verStatus).toHaveBeenCalledWith(200)
    expect(verJson).toHaveBeenCalledWith({
      verified: true,
      order: expect.objectContaining({ id: "order_1" }),
      tracking_ref: cart.metadata.payment_session.authority,
    })

    // Reject canceled payment callback
    await expect(
      verifyPayment(
        {
          validatedBody: {
            cart_id: "cart_1",
            authority: cart.metadata.payment_session.authority,
            status: "NOK",
          },
          scope: { resolve },
        } as any,
        makeRes().res
      )
    ).rejects.toThrow("پرداخت توسط کاربر لغو شد یا ناموفق بود.")
  })
})
