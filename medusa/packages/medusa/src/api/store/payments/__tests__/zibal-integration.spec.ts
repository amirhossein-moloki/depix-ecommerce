import {
  ConfigurationError,
  PaymentStatus,
} from "@amirhossein-moloki/payment-core"
import {
  InMemoryIdempotencyRepository,
  InMemoryPaymentRepository,
  InMemoryTransactionRepository,
  InMemoryWebhookEventRepository,
  sanitizeContext,
} from "@amirhossein-moloki/payment-service"
import { HttpTransport } from "@amirhossein-moloki/payment-zibal"
import { Modules } from "@medusajs/framework/utils"
import { GET as gatewayCallbackGet, POST as gatewayCallbackPost } from "../../../payment/callback/[gateway]/route"
import { GET as callbackGet, POST as callbackPost } from "../../../payment/callback/route"
import { POST as cartPaymentSession } from "../../carts/[id]/payment-sessions/route"
import { GET as inquirePayment } from "../[id]/inquiry/route"
import {
  buildFailedRedirectUrl,
  buildPaymentRedirectUrls,
  buildSuccessRedirectUrl,
  loadZibalRuntimeConfig,
  validatePaymentPlatformStartupConfig,
} from "../config"
import { POST as initiatePayment } from "../initiate/route"
import {
  createPaymentPlatform,
  setPaymentPlatformOverride,
} from "../platform"
import { POST as verifyPayment } from "../verify/route"

class MockZibalTransport implements HttpTransport {
  public calls: Array<{ url: string; body: any; timeoutMs?: number }> = []
  public handlers = new Map<string, (body: any) => Promise<any> | any>()

  public async post<T>(
    url: string,
    body: unknown,
    _headers?: Record<string, string>,
    timeoutMs?: number
  ): Promise<T> {
    this.calls.push({ url, body, timeoutMs })

    for (const [pattern, handler] of this.handlers.entries()) {
      if (url.includes(pattern)) {
        return (await handler(body)) as T
      }
    }

    throw new Error(`Unhandled mock Zibal URL: ${url}`)
  }
}

describe("Zibal Payment Platform Integration & Redirect Flow", () => {
  const originalEnv = process.env

  const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    const redirect = jest.fn()
    return { res: { json, status, redirect } as any, json, status, redirect }
  }

  const createMockScope = (cart: any, initialOrderCount = 0) => {
    let orderSeq = initialOrderCount
    const cartService = {
      retrieveCart: jest
        .fn()
        .mockImplementation(() => Promise.resolve(cart)),
    }
    const completeCalls: any[] = []
    const we = {
      run: jest.fn().mockImplementation((wfId: string, opts: any) => {
        if (opts?.input?.metadata?.payment_session) {
          cart.metadata = {
            ...(cart.metadata || {}),
            payment_session: opts.input.metadata.payment_session,
          }
          return Promise.resolve({})
        }
        orderSeq += 1
        const order = {
          id: `order_${orderSeq}`,
          display_id: 2000 + orderSeq,
          total: cart.total,
        }
        cart.completed_at = new Date().toISOString()
        completeCalls.push({ wfId, opts, order })
        return Promise.resolve({ result: order })
      }),
    }
    const orderService = {
      retrieveOrder: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({ id, display_id: 2001, total: cart.total })
      ),
    }

    const resolve = jest.fn((key: string) => {
      if (key === Modules.CART) return cartService
      if (key === Modules.WORKFLOW_ENGINE) return we
      if (key === Modules.ORDER) return orderService
      throw new Error(`Unexpected resolve key: ${key}`)
    })

    return { scope: { resolve } as any, we, completeCalls, cartService }
  }

  const setupTestPlatform = async (options?: {
    appUrl?: string
    environment?: "sandbox" | "production"
    merchant?: string
    callbackUrl?: string
    timeoutMs?: number
  }) => {
    const transport = new MockZibalTransport()
    const environment = options?.environment ?? "sandbox"
    const appUrl = options?.appUrl ?? "https://shop.example.com///"
    const merchant =
      options?.merchant ?? (environment === "production" ? "prod_merchant_999" : "zibal")
    const callbackUrl =
      options?.callbackUrl ?? "https://api.example.com/payment/callback"

    const config = loadZibalRuntimeConfig({
      NODE_ENV: "test",
      PAYMENT_ENV: environment,
      APP_URL: appUrl,
      ZIBAL_MERCHANT: merchant,
      ZIBAL_CALLBACK_URL: callbackUrl,
      PAYMENT_TIMEOUT_MS: String(options?.timeoutMs ?? 5000),
    })

    const runtime = await createPaymentPlatform({
      config,
      transport,
      repositories: {
        paymentRepository: new InMemoryPaymentRepository(),
        transactionRepository: new InMemoryTransactionRepository(),
        idempotencyRepository: new InMemoryIdempotencyRepository(),
        webhookEventRepository: new InMemoryWebhookEventRepository(),
      },
    })

    setPaymentPlatformOverride(runtime)
    return { runtime, transport }
  }

  beforeEach(() => {
    jest.restoreAllMocks()
    setPaymentPlatformOverride(null)
    process.env = { ...originalEnv, NODE_ENV: "test" }
  })

  afterAll(() => {
    setPaymentPlatformOverride(null)
    process.env = originalEnv
  })

  describe("Configuration, APP_URL & Domain Validation", () => {
    it("strips trailing slashes and constructs /payment/success and /payment/failed URLs", () => {
      const urls = buildPaymentRedirectUrls("https://example.com///", "production")
      expect(urls).toEqual({
        appUrl: "https://example.com",
        successUrl: "https://example.com/payment/success",
        failedUrl: "https://example.com/payment/failed",
      })

      expect(
        buildSuccessRedirectUrl("http://localhost:3000/", "sandbox", {
          payment_id: "pay_1",
          order_id: "order_1",
          track_id: "123456",
          ref_id: "998877",
        })
      ).toBe(
        "http://localhost:3000/payment/success?payment_id=pay_1&order_id=order_1&track_id=123456&ref_id=998877"
      )

      expect(
        buildFailedRedirectUrl("https://shop.example.com/", "production", {
          payment_id: "pay_1",
          reason: "verification_failed",
        })
      ).toBe(
        "https://shop.example.com/payment/failed?payment_id=pay_1&reason=verification_failed"
      )
    })

    it("rejects missing or invalid APP_URL and non-HTTPS APP_URL in production", () => {
      expect(() =>
        loadZibalRuntimeConfig({
          PAYMENT_ENV: "sandbox",
          ZIBAL_MERCHANT: "zibal",
          ZIBAL_CALLBACK_URL: "http://localhost:9000/payment/callback",
        } as any)
      ).toThrow(ConfigurationError)

      expect(() =>
        loadZibalRuntimeConfig({
          PAYMENT_ENV: "sandbox",
          APP_URL: "not-a-valid-url",
          ZIBAL_MERCHANT: "zibal",
          ZIBAL_CALLBACK_URL: "http://localhost:9000/payment/callback",
        } as any)
      ).toThrow(ConfigurationError)

      expect(() =>
        loadZibalRuntimeConfig({
          PAYMENT_ENV: "production",
          APP_URL: "http://example.com",
          ZIBAL_MERCHANT: "real_merchant_id",
          ZIBAL_CALLBACK_URL: "https://api.example.com/payment/callback",
        } as any)
      ).toThrow(ConfigurationError)
    })

    it("rejects missing merchant or test merchant 'zibal' in production without leaking secrets", () => {
      expect(() =>
        validatePaymentPlatformStartupConfig({
          PAYMENT_ENV: "production",
          APP_URL: "https://example.com",
          ZIBAL_MERCHANT: "zibal",
          ZIBAL_CALLBACK_URL: "https://api.example.com/payment/callback",
        } as any)
      ).toThrow(ConfigurationError)

      expect(() =>
        validatePaymentPlatformStartupConfig({
          PAYMENT_ENV: "production",
          APP_URL: "https://example.com",
          ZIBAL_MERCHANT: "",
          ZIBAL_CALLBACK_URL: "https://api.example.com/payment/callback",
        } as any)
      ).toThrow(ConfigurationError)

      expect(sanitizeContext({ merchant: "secret_123", zibal_merchant: "secret_123", safe: "ok" })).toEqual({
        merchant: "[REDACTED]",
        zibal_merchant: "[REDACTED]",
        safe: "ok",
      })
    })
  })

  describe("Payment Creation, Callback Verification, Redirects & Idempotency", () => {
    it("initiates payment with Rial amount (no double conversion) and returns redirect_url", async () => {
      const { transport } = await setupTestPlatform({
        appUrl: "http://localhost:3000/",
        environment: "sandbox",
      })

      transport.handlers.set("/v1/request", (body) => {
        expect(body).toMatchObject({
          merchant: "zibal",
          amount: 2500000,
          callbackUrl: "https://api.example.com/payment/callback",
        })
        return { trackId: 400100200, result: 100, message: "success" }
      })

      const cart: any = {
        id: "cart_zib_1",
        total: 2500000,
        currency_code: "irr",
        metadata: {},
      }
      const { scope } = createMockScope(cart)

      const { res, status, json } = makeRes()
      await initiatePayment(
        {
          validatedBody: { cart_id: "cart_zib_1", provider: "zibal" },
          scope,
        } as any,
        res
      )

      expect(status).toHaveBeenCalledWith(200)
      const body = json.mock.calls[0][0]
      expect(body).toMatchObject({
        provider: "zibal",
        track_id: "400100200",
        authority: "400100200",
        amount_irr: 2500000,
        redirect_url: "https://gateway.zibal.ir/start/400100200",
        status: PaymentStatus.PENDING,
      })

      // Also verify /store/carts/:id/payment-sessions alias works for Zibal
      const { res: res2, status: status2 } = makeRes()
      await cartPaymentSession(
        {
          params: { id: "cart_zib_1" },
          validatedBody: { provider: "zibal" },
          scope,
        } as any,
        res2
      )
      expect(status2).toHaveBeenCalledWith(200)
    })

    it("fails cleanly on Zibal request error and never fulfills cart", async () => {
      const { runtime, transport } = await setupTestPlatform()
      transport.handlers.set("/v1/request", () => ({
        trackId: 0,
        result: 105,
        message: "amount invalid",
      }))

      const cart: any = { id: "cart_zib_fail", total: 2000, currency_code: "irr", metadata: {} }
      const { scope, completeCalls } = createMockScope(cart)
      const { res } = makeRes()

      await expect(
        initiatePayment(
          { validatedBody: { cart_id: "cart_zib_fail", provider: "zibal" }, scope } as any,
          res
        )
      ).rejects.toThrow()

      expect(completeCalls).toHaveLength(0)
      const stored = await runtime.paymentRepo.list({})
      expect(stored[0]?.status).toBe(PaymentStatus.FAILED)
    })

    it("verifies valid callback server-side, fulfills order once, handles duplicate callbacks idempotently, and redirects to APP_URL/payment/success", async () => {
      const { runtime, transport } = await setupTestPlatform({
        appUrl: "https://storefront.example.com/",
        environment: "production",
        merchant: "real_zibal_merchant_key",
      })

      transport.handlers.set("/v1/request", () => ({
        trackId: 77889911,
        result: 100,
        message: "success",
      }))
      transport.handlers.set("/v1/verify", () => ({
        amount: 500000,
        result: 100,
        status: 1,
        refNumber: 987654,
        cardNumber: "603799******1111",
        message: "success",
      }))

      const cart: any = { id: "cart_dup", total: 500000, currency_code: "irr", metadata: {} }
      const { scope, completeCalls } = createMockScope(cart)

      const { res: initRes, json: initJson } = makeRes()
      await initiatePayment(
        { validatedBody: { cart_id: "cart_dup", provider: "zibal" }, scope } as any,
        initRes
      )
      const { payment_id, track_id } = initJson.mock.calls[0][0]

      // Simulate concurrent duplicate browser callbacks
      const { res: cbRes1, redirect: cbRedirect1 } = makeRes()
      const { res: cbRes2, redirect: cbRedirect2 } = makeRes()

      await Promise.all([
        callbackGet(
          {
            query: { trackId: track_id, success: "1", status: "2", orderId: payment_id },
            body: {},
            headers: {},
            scope,
          } as any,
          cbRes1
        ),
        gatewayCallbackPost(
          {
            params: { gateway: "zibal" },
            query: {},
            body: { trackId: track_id, success: "1", status: "2", orderId: payment_id },
            headers: {},
            scope,
          } as any,
          cbRes2
        ),
      ])

      const expectedRedirect = `https://storefront.example.com/payment/success?payment_id=${payment_id}&order_id=order_1&track_id=${track_id}&ref_id=987654`
      expect(cbRedirect1).toHaveBeenCalledWith(302, expectedRedirect)
      expect(cbRedirect2).toHaveBeenCalledWith(302, expectedRedirect)

      // Sequential duplicate callback + repeated /store/payments/verify must NOT call Zibal /v1/verify again or create another order
      const { res: cbRes3, redirect: cbRedirect3 } = makeRes()
      await callbackPost(
        {
          query: { trackId: track_id, success: "1", status: "1", orderId: payment_id },
          body: {},
          headers: {},
          scope,
        } as any,
        cbRes3
      )
      expect(cbRedirect3).toHaveBeenCalledWith(302, expectedRedirect)

      const { res: verRes, status: verStatus, json: verJson } = makeRes()
      await verifyPayment(
        { validatedBody: { cart_id: "cart_dup", track_id }, scope } as any,
        verRes
      )
      expect(verStatus).toHaveBeenCalledWith(200)
      expect(verJson).toHaveBeenCalledWith(
        expect.objectContaining({
          verified: true,
          already_verified: true,
          tracking_ref: "987654",
          order: expect.objectContaining({ id: "order_1" }),
        })
      )

      const verifyCalls = transport.calls.filter((c) => c.url.includes("/v1/verify"))
      expect(verifyCalls).toHaveLength(1)
      expect(completeCalls).toHaveLength(1)

      const paymentRecord = await runtime.paymentRepo.findById(payment_id)
      expect(paymentRecord?.status).toBe(PaymentStatus.SUCCESS)
    })

    it("never marks order paid from browser callback success=1 if Zibal server-side verification fails", async () => {
      const { runtime, transport } = await setupTestPlatform({
        appUrl: "https://shop.example.com",
        environment: "sandbox",
      })

      transport.handlers.set("/v1/request", () => ({
        trackId: 55667788,
        result: 100,
        message: "success",
      }))
      transport.handlers.set("/v1/verify", () => ({
        result: 202,
        message: "payment not paid",
      }))

      const cart: any = { id: "cart_tamper", total: 100000, currency_code: "irr", metadata: {} }
      const { scope, completeCalls } = createMockScope(cart)
      const { res: initRes, json: initJson } = makeRes()

      await initiatePayment(
        { validatedBody: { cart_id: "cart_tamper", provider: "zibal" }, scope } as any,
        initRes
      )
      const { payment_id, track_id } = initJson.mock.calls[0][0]

      const { res: cbRes, redirect } = makeRes()
      await callbackGet(
        {
          query: { trackId: track_id, success: "1", status: "2", orderId: payment_id },
          body: {},
          headers: {},
          scope,
        } as any,
        cbRes
      )

      expect(completeCalls).toHaveLength(0)
      expect(redirect).toHaveBeenCalledWith(
        302,
        `https://shop.example.com/payment/failed?payment_id=${payment_id}&track_id=${track_id}&reason=verification_failed`
      )

      const stored = await runtime.paymentRepo.findById(payment_id)
      expect(stored?.status).toBe(PaymentStatus.FAILED)
    })

    it("handles cancelled, failed, invalid callback data, incorrect trackId, and amount mismatch", async () => {
      const { runtime, transport } = await setupTestPlatform({
        appUrl: "https://shop.example.com/",
        environment: "sandbox",
      })

      let nextTrack = 10001000
      transport.handlers.set("/v1/request", () => ({
        trackId: nextTrack++,
        result: 100,
        message: "success",
      }))

      // 1. Invalid callback data & unsupported gateway redirect
      const emptyScope = createMockScope({ id: "cart_x", total: 10000, currency_code: "irr" }).scope
      const { res: badCbRes, redirect: badCbRedirect } = makeRes()
      await callbackGet({ query: { success: "1" }, body: {}, headers: {}, scope: emptyScope } as any, badCbRes)
      expect(badCbRedirect).toHaveBeenCalledWith(
        302,
        "https://shop.example.com/payment/failed?reason=invalid_callback"
      )

      process.env.APP_URL = "https://shop.example.com/"
      const { res: unsupRes, redirect: unsupRedirect } = makeRes()
      await gatewayCallbackGet(
        { params: { gateway: "unknown" }, query: {}, body: {}, headers: {}, scope: emptyScope } as any,
        unsupRes
      )
      expect(unsupRedirect).toHaveBeenCalledWith(
        302,
        "https://shop.example.com/payment/failed?reason=unsupported_gateway"
      )

      // 2. Cancelled transaction (status=3, success=0)
      const cartCancel: any = { id: "cart_cancel", total: 120000, currency_code: "irr", metadata: {} }
      const cancelScope = createMockScope(cartCancel)
      const { res: r1, json: j1 } = makeRes()
      await initiatePayment({ validatedBody: { cart_id: "cart_cancel", provider: "zibal" }, scope: cancelScope.scope } as any, r1)
      const pCancel = j1.mock.calls[0][0]

      const { res: rCancel, redirect: redCancel } = makeRes()
      await callbackGet(
        {
          query: { trackId: pCancel.track_id, success: "0", status: "3", orderId: pCancel.payment_id },
          body: {},
          headers: {},
          scope: cancelScope.scope,
        } as any,
        rCancel
      )
      expect(redCancel).toHaveBeenCalledWith(
        302,
        `https://shop.example.com/payment/failed?payment_id=${pCancel.payment_id}&track_id=${pCancel.track_id}&reason=cancelled`
      )
      expect((await runtime.paymentRepo.findById(pCancel.payment_id))?.status).toBe(PaymentStatus.CANCELLED)

      // 3. Incorrect trackId
      const cartWrongTrack: any = { id: "cart_wrong_track", total: 150000, currency_code: "irr", metadata: {} }
      const wtScope = createMockScope(cartWrongTrack)
      const { res: r2, json: j2 } = makeRes()
      await initiatePayment({ validatedBody: { cart_id: "cart_wrong_track", provider: "zibal" }, scope: wtScope.scope } as any, r2)
      const pWt = j2.mock.calls[0][0]

      const { res: rWtCb, redirect: redWtCb } = makeRes()
      await callbackGet(
        {
          query: { trackId: "99999999", success: "1", status: "2", orderId: pWt.payment_id },
          body: {},
          headers: {},
          scope: wtScope.scope,
        } as any,
        rWtCb
      )
      expect(redWtCb).toHaveBeenCalledWith(
        302,
        `https://shop.example.com/payment/failed?payment_id=${pWt.payment_id}&track_id=99999999&reason=invalid_track_id`
      )
      expect(wtScope.completeCalls).toHaveLength(0)

      await expect(
        verifyPayment(
          { validatedBody: { cart_id: "cart_wrong_track", track_id: "99999999" }, scope: wtScope.scope } as any,
          makeRes().res
        )
      ).rejects.toThrow()

      // 4. Amount mismatch on Zibal verify response
      transport.handlers.set("/v1/verify", () => ({
        amount: 50000, // mismatched vs 150000
        result: 100,
        status: 1,
        refNumber: 334455,
        message: "success",
      }))
      const { res: rAmtCb, redirect: redAmtCb } = makeRes()
      await callbackGet(
        {
          query: { trackId: pWt.track_id, success: "1", status: "2", orderId: pWt.payment_id },
          body: {},
          headers: {},
          scope: wtScope.scope,
        } as any,
        rAmtCb
      )
      expect(redAmtCb).toHaveBeenCalledWith(
        302,
        `https://shop.example.com/payment/failed?payment_id=${pWt.payment_id}&track_id=${pWt.track_id}&reason=amount_mismatch`
      )
      expect(wtScope.completeCalls).toHaveLength(0)
      expect((await runtime.paymentRepo.findById(pWt.payment_id))?.status).toBe(PaymentStatus.FAILED)
    })

    it("handles API timeouts/network errors without leaking credentials and supports inquiry", async () => {
      const secretMerchant = "zibal_prod_secret_do_not_leak"
      const { transport } = await setupTestPlatform({
        appUrl: "https://shop.example.com",
        environment: "production",
        merchant: secretMerchant,
      })

      transport.handlers.set("/v1/request", () => ({
        trackId: 88112233,
        result: 100,
        message: "success",
      }))
      transport.handlers.set("/v1/verify", () => {
        throw new Error(`Zibal API request timed out for ${secretMerchant}`)
      })
      transport.handlers.set("/v1/inquiry", () => ({
        result: 100,
        status: 1,
        amount: 300000,
        refNumber: 554433,
        message: "success",
      }))

      const cart: any = { id: "cart_timeout", total: 300000, currency_code: "irr", metadata: {} }
      const { scope, completeCalls } = createMockScope(cart)
      const { res: initRes, json: initJson } = makeRes()

      await initiatePayment({ validatedBody: { cart_id: "cart_timeout", provider: "zibal" }, scope } as any, initRes)
      const { payment_id, track_id } = initJson.mock.calls[0][0]

      const { res: cbRes, redirect } = makeRes()
      await callbackGet(
        {
          query: { trackId: track_id, success: "1", status: "2", orderId: payment_id },
          body: {},
          headers: {},
          scope,
        } as any,
        cbRes
      )

      const redirectUrl = redirect.mock.calls[0][1] as string
      expect(redirectUrl).toContain("https://shop.example.com/payment/failed")
      expect(redirectUrl).toContain("reason=timeout")
      expect(redirectUrl).not.toContain(secretMerchant)
      expect(completeCalls).toHaveLength(0)

      // Inquiry endpoint works
      const { res: inqRes, status: inqStatus, json: inqJson } = makeRes()
      await inquirePayment({ params: { id: payment_id }, scope } as any, inqRes)
      expect(inqStatus).toHaveBeenCalledWith(200)
      expect(inqJson).toHaveBeenCalledWith({
        payment_id,
        status: PaymentStatus.SUCCESS,
        amount: 300000,
        reference: "554433",
        track_id: "88112233",
      })
    })
  })
})
