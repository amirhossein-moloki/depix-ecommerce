import {
  Payment,
  PaymentStatus,
  TransactionType,
} from "@amirhossein-moloki/payment-core"
import { toZibalRialAmount } from "@amirhossein-moloki/payment-zibal"
import {
  completeCartWorkflowId,
  updateCartWorkflowId,
} from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import crypto from "crypto"
import {
  buildFailedRedirectUrl,
  buildSuccessRedirectUrl,
} from "./config"
import { getPaymentPlatform, PaymentPlatformRuntime } from "./platform"

export interface InitiatePaymentInput {
  cartId: string
  provider?: string
  callbackUrl?: string
  idempotencyKey?: string
}

export interface VerifyPaymentInput {
  cartId?: string
  paymentId?: string
  authority?: string
  trackId?: string
  refId?: string
  status?: string
  provider?: string
}

export interface CallbackRequestInput {
  query: Record<string, unknown>
  body: Record<string, unknown>
  headers: Record<string, string | string[] | undefined>
}

export interface CallbackRedirectResult {
  statusCode: 302
  redirectUrl: string
  status: "success" | "failed" | "cancelled"
  paymentId?: string
  orderId?: string
  trackId?: string
  refId?: string
  reason?: string
}

const inFlightCompletions = new Map<string, Promise<any>>()
const inFlightCallbacks = new Map<string, Promise<CallbackRedirectResult>>()

const getZarinpalBaseUrl = () =>
  process.env.ZARINPAL_SANDBOX === "true"
    ? "https://sandbox.zarinpal.com"
    : "https://api.zarinpal.com"

const getZarinpalStartPayBaseUrl = () =>
  process.env.ZARINPAL_SANDBOX === "true"
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://www.zarinpal.com/pg/StartPay"

async function updateCartMetadata(
  scope: MedusaContainer,
  cart: any,
  paymentSession: Record<string, unknown>
): Promise<void> {
  const nextMetadata = {
    ...(cart?.metadata ?? {}),
    payment_session: paymentSession,
  }

  let we: any = null
  try {
    we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
  } catch {
    we = null
  }

  if (we?.run) {
    await we.run(updateCartWorkflowId, {
      input: {
        id: cart.id,
        metadata: nextMetadata,
      },
    })
  } else {
    const cartService = scope.resolve<any>(Modules.CART)
    await cartService.updateCarts(cart.id, {
      metadata: nextMetadata,
    })
  }
}

async function resolveExistingOrder(
  scope: MedusaContainer,
  orderId: string
): Promise<any> {
  try {
    const orderService = scope.resolve<any>(Modules.ORDER)
    if (orderService?.retrieveOrder) {
      return await orderService.retrieveOrder(orderId)
    }
  } catch {
    // Return minimal order reference when order module is unavailable in unit tests
  }
  return { id: orderId }
}

async function persistPaymentTerminalState(
  platform: PaymentPlatformRuntime,
  paymentId: string,
  targetStatus: PaymentStatus.FAILED | PaymentStatus.CANCELLED,
  extraMetadata?: Record<string, unknown>
): Promise<Payment | null> {
  const latest = await platform.paymentRepo.findById(paymentId)
  if (!latest) {
    return null
  }

  const terminalStatuses = new Set<PaymentStatus>([
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
    PaymentStatus.REVERSED,
    PaymentStatus.REFUNDED,
  ])

  if (terminalStatuses.has(latest.status)) {
    return latest
  }

  const nextMetadata = extraMetadata
    ? { ...(latest.metadata || {}), ...extraMetadata }
    : latest.metadata

  const updatedEntity = new Payment({
    id: latest.id,
    projectId: latest.projectId,
    amount: latest.amount,
    currency: latest.currency,
    description: latest.description,
    callbackUrl: latest.callbackUrl,
    gateway: latest.gateway,
    status: latest.status,
    metadata: nextMetadata,
    idempotencyKey: latest.idempotencyKey,
    version: latest.version,
    createdAt: latest.createdAt,
    updatedAt: latest.updatedAt,
  })
  updatedEntity.transitionTo(targetStatus)

  return platform.paymentRepo.update(updatedEntity, latest.version)
}

async function attachOrderMetadataToPayment(
  platform: PaymentPlatformRuntime,
  paymentId: string,
  metadataPatch: Record<string, unknown>
): Promise<void> {
  const latest = await platform.paymentRepo.findById(paymentId)
  if (!latest) {
    return
  }

  const updatedEntity = new Payment({
    id: latest.id,
    projectId: latest.projectId,
    amount: latest.amount,
    currency: latest.currency,
    description: latest.description,
    callbackUrl: latest.callbackUrl,
    gateway: latest.gateway,
    status: latest.status,
    metadata: { ...(latest.metadata || {}), ...metadataPatch },
    idempotencyKey: latest.idempotencyKey,
    version: latest.version,
    createdAt: latest.createdAt,
    updatedAt: latest.updatedAt,
  })

  await platform.paymentRepo.update(updatedEntity, latest.version)
}

async function completeCartIdempotently(
  scope: MedusaContainer,
  params: {
    cartId: string
    paymentId?: string
    trackId?: string
    refId?: string
    platform?: PaymentPlatformRuntime
  }
): Promise<{ order: any; orderId?: string; alreadyFulfilled: boolean }> {
  const existingLock = inFlightCompletions.get(params.cartId)
  if (existingLock) {
    return existingLock
  }

  const task = (async () => {
    const cartService = scope.resolve<any>(Modules.CART)
    const cart = await cartService.retrieveCart(params.cartId).catch(() => null)
    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `سبد خرید با شناسه '${params.cartId}' یافت نشد.`
      )
    }

    const sessionOrderId = cart.metadata?.payment_session?.order_id as
      | string
      | undefined
    let paymentOrderId: string | undefined
    if (params.platform && params.paymentId) {
      const p = await params.platform.paymentRepo.findById(params.paymentId)
      paymentOrderId = p?.metadata?.order_id as string | undefined
    }

    const existingOrderId = sessionOrderId || paymentOrderId
    if (existingOrderId || cart.completed_at) {
      const order = existingOrderId
        ? await resolveExistingOrder(scope, existingOrderId)
        : { id: existingOrderId }
      return {
        order,
        orderId: existingOrderId || order?.id,
        alreadyFulfilled: true,
      }
    }

    const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
    const { result: order } = await we.run(completeCartWorkflowId, {
      input: { id: cart.id },
    })

    const orderId = order?.id ? String(order.id) : undefined
    const nextSession = {
      ...(cart.metadata?.payment_session ?? {}),
      payment_id:
        params.paymentId || cart.metadata?.payment_session?.payment_id,
      track_id: params.trackId || cart.metadata?.payment_session?.track_id,
      ref_id: params.refId || cart.metadata?.payment_session?.ref_id,
      status: "paid",
      order_id: orderId,
      verified_at: new Date().toISOString(),
    }

    try {
      await updateCartMetadata(scope, cart, nextSession)
    } catch {
      // Completed cart updates may fail in some adapters; payment metadata still records order_id
    }

    if (params.platform && params.paymentId && orderId) {
      await attachOrderMetadataToPayment(params.platform, params.paymentId, {
        order_id: orderId,
        ref_id: params.refId,
        track_id: params.trackId,
      }).catch(() => undefined)
    }

    return {
      order,
      orderId,
      alreadyFulfilled: false,
    }
  })()

  inFlightCompletions.set(params.cartId, task)
  try {
    return await task
  } finally {
    if (inFlightCompletions.get(params.cartId) === task) {
      inFlightCompletions.delete(params.cartId)
    }
  }
}

function classifyFailureReason(err: unknown): string {
  const message =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
  if (message.includes("amount")) {
    return "amount_mismatch"
  }
  if (
    message.includes("trackid") ||
    message.includes("transaction id") ||
    message.includes("does not match")
  ) {
    return "invalid_track_id"
  }
  if (message.includes("timed out") || message.includes("timeout")) {
    return "timeout"
  }
  return "verification_failed"
}

function sanitizeGatewayErrorMessage(err: unknown, secret?: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (secret && secret.trim().length > 0 && raw.includes(secret.trim())) {
    return raw.split(secret.trim()).join("[REDACTED]")
  }
  return raw
}

export const initiateGatewayPayment = async (
  scope: MedusaContainer,
  {
    cartId,
    provider = "zarinpal",
    callbackUrl,
    idempotencyKey,
  }: InitiatePaymentInput
) => {
  const cartService = scope.resolve<any>(Modules.CART)
  const cart = await cartService.retrieveCart(cartId).catch(() => null)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `سبد خرید با شناسه '${cartId}' یافت نشد.`
    )
  }

  const amountValue = Number(cart.total ?? 0)
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "مبلغ قابل پرداخت سبد خرید باید بیشتر از صفر ریال باشد."
    )
  }

  const normalizedProvider = String(provider || "zarinpal")
    .trim()
    .toLowerCase()

  if (normalizedProvider === "zibal") {
    let amountIrr: number
    try {
      amountIrr = toZibalRialAmount(
        amountValue,
        String(cart.currency_code ?? "IRR")
      )
    } catch (err) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        err instanceof Error ? err.message : "مبلغ سبد خرید برای درگاه زیبال نامعتبر است."
      )
    }

    const platform = await getPaymentPlatform(scope)
    const effectiveCallbackUrl = callbackUrl || platform.config.callbackUrl

    let result
    try {
      result = await platform.service.createPayment({
        gateway: "zibal",
        amount: amountIrr,
        currency: "IRR",
        callbackUrl: effectiveCallbackUrl,
        description: `پرداخت سفارش سبد ${cart.id}`,
        idempotencyKey,
        metadata: {
          cart_id: cart.id,
          customer_id: cart.customer_id ?? undefined,
          currency_original: cart.currency_code ?? "irr",
        },
        options: {
          callbackUrl: effectiveCallbackUrl,
          mobile: cart.shipping_address?.phone ?? cart.metadata?.phone ?? undefined,
        },
      })
    } catch (err) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        sanitizeGatewayErrorMessage(err, platform.config.merchant)
      )
    }

    const trackId = result.gatewayTransactionId
    const paymentSession = {
      payment_id: result.payment.id,
      track_id: trackId,
      authority: trackId,
      provider: "zibal",
      amount_irr: amountIrr,
      callback_url: effectiveCallbackUrl,
      status: "pending",
      initiated_at: new Date().toISOString(),
    }

    await updateCartMetadata(scope, cart, paymentSession)

    return {
      payment_id: result.payment.id,
      redirect_url: result.redirectUrl,
      track_id: trackId,
      authority: trackId,
      amount_irr: amountIrr,
      provider: "zibal",
      status: result.status,
    }
  }

  const effectiveCallbackUrl = callbackUrl || process.env.ZARINPAL_CALLBACK_URL
  if (!effectiveCallbackUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "آدرس بازگشت (callback_url) الزامی است."
    )
  }

  const paymentId = `pay_${crypto.randomBytes(10).toString("hex")}`
  let authority = `A000000000000000000000000000${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`
  let redirectUrl = `${effectiveCallbackUrl}${effectiveCallbackUrl.includes("?") ? "&" : "?"}Authority=${authority}&Status=OK`

  const merchantId = process.env.ZARINPAL_MERCHANT_ID
  if (normalizedProvider === "zarinpal" && merchantId) {
    const response = await fetch(
      `${getZarinpalBaseUrl()}/pg/v4/payment/request.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: amountValue,
          callback_url: effectiveCallbackUrl,
          description: `پرداخت سفارش سبد ${cart.id}`,
          metadata: {
            email: cart.email ?? undefined,
            mobile:
              cart.shipping_address?.phone ?? cart.metadata?.phone ?? undefined,
          },
        }),
      }
    )

    const payload = (await response.json()) as any
    if (payload?.data?.code !== 100 || !payload?.data?.authority) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        payload?.errors?.message || "خطا در اتصال به درگاه پرداخت زرین‌پال."
      )
    }

    authority = payload.data.authority
    redirectUrl = `${getZarinpalStartPayBaseUrl()}/${authority}`
  }

  const paymentSession = {
    payment_id: paymentId,
    authority,
    provider: normalizedProvider,
    amount_irr: amountValue,
    callback_url: effectiveCallbackUrl,
    status: "pending",
    initiated_at: new Date().toISOString(),
  }

  await updateCartMetadata(scope, cart, paymentSession)

  return {
    payment_id: paymentId,
    redirect_url: redirectUrl,
    authority,
    amount_irr: amountValue,
    provider: normalizedProvider,
  }
}

export const verifyGatewayPayment = async (
  scope: MedusaContainer,
  {
    cartId,
    paymentId,
    authority,
    trackId,
    refId,
    status,
    provider,
  }: VerifyPaymentInput
) => {
  const isFailureStatus = Boolean(
    status &&
      ["0", "3", "nok", "failed", "canceled", "cancelled"].includes(
        status.trim().toLowerCase()
      )
  )

  let cart: any = null
  if (cartId) {
    const cartService = scope.resolve<any>(Modules.CART)
    cart = await cartService.retrieveCart(cartId).catch(() => null)
    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `سبد خرید با شناسه '${cartId}' یافت نشد.`
      )
    }
  }

  const session = cart?.metadata?.payment_session
  const resolvedProvider = (
    provider ||
    session?.provider ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase()

  const isZibalFlow =
    resolvedProvider === "zibal" ||
    Boolean(trackId) ||
    (!cart && Boolean(paymentId))

  if (isZibalFlow) {
    const platform = await getPaymentPlatform(scope)
    const targetPaymentId = paymentId || (session?.payment_id as string | undefined)
    const providedTrackId = trackId || authority

    let payment: Payment | null = null
    if (targetPaymentId) {
      payment = await platform.paymentRepo.findById(targetPaymentId)
    } else if (providedTrackId) {
      payment = await platform.paymentRepo.findByExternalId(
        String(providedTrackId)
      )
    }

    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "تراکنش پرداخت زیبال یافت نشد."
      )
    }

    const paymentTxs = await platform.transactionRepo.findByType(
      payment.id,
      TransactionType.PAYMENT
    )
    const initialTrackId =
      paymentTxs[paymentTxs.length - 1]?.gatewayTransactionId ||
      (session?.track_id as string | undefined)

    if (
      providedTrackId &&
      initialTrackId &&
      String(providedTrackId).trim() !== String(initialTrackId).trim()
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "کد رهگیری (trackId) درگاه زیبال با تراکنش مطابقت ندارد."
      )
    }

    const effectiveCartId =
      cart?.id || (payment.metadata?.cart_id as string | undefined)

    if (payment.status === PaymentStatus.SUCCESS) {
      const verifyTxs = await platform.transactionRepo.findByType(
        payment.id,
        TransactionType.VERIFY
      )
      const verifiedRef =
        verifyTxs[0]?.reference ||
        (payment.metadata?.ref_id as string | undefined) ||
        initialTrackId
      let order: any = null
      if (effectiveCartId) {
        const fulfilled = await completeCartIdempotently(scope, {
          cartId: effectiveCartId,
          paymentId: payment.id,
          trackId: initialTrackId,
          refId: verifiedRef,
          platform,
        })
        order = fulfilled.order
      }

      return {
        verified: true,
        already_verified: true,
        payment_id: payment.id,
        track_id: initialTrackId,
        order,
        tracking_ref: verifiedRef,
      }
    }

    if (isFailureStatus) {
      const targetStatus =
        status?.trim() === "3" ? PaymentStatus.CANCELLED : PaymentStatus.FAILED
      await persistPaymentTerminalState(platform, payment.id, targetStatus)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "پرداخت توسط کاربر لغو شد یا ناموفق بود."
      )
    }

    const effectiveTrackId = providedTrackId || initialTrackId
    if (!effectiveTrackId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "کد رهگیری (trackId) برای تایید تراکنش الزامی است."
      )
    }

    let verifyResult
    try {
      verifyResult = await platform.service.verifyPayment({
        paymentId: payment.id,
        gatewayTransactionId: String(effectiveTrackId).trim(),
      })
    } catch (err) {
      await persistPaymentTerminalState(
        platform,
        payment.id,
        PaymentStatus.FAILED,
        {
          failure_reason: classifyFailureReason(err),
        }
      )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        sanitizeGatewayErrorMessage(err, platform.config.merchant)
      )
    }

    if (verifyResult.status !== PaymentStatus.SUCCESS) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "تایید تراکنش از سمت درگاه زیبال ناموفق بود."
      )
    }

    const verifiedRef = verifyResult.reference || String(effectiveTrackId)
    let order: any = null
    if (effectiveCartId) {
      const fulfilled = await completeCartIdempotently(scope, {
        cartId: effectiveCartId,
        paymentId: payment.id,
        trackId: String(effectiveTrackId),
        refId: verifiedRef,
        platform,
      })
      order = fulfilled.order
    }

    return {
      verified: true,
      payment_id: payment.id,
      track_id: String(effectiveTrackId),
      order,
      tracking_ref: verifiedRef,
    }
  }

  if (isFailureStatus) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "پرداخت توسط کاربر لغو شد یا ناموفق بود."
    )
  }

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "شناسه سبد خرید (cart_id) الزامی است."
    )
  }

  if (
    authority &&
    session?.authority &&
    session.authority !== authority
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "کد پیگیری (Authority) درگاه پرداخت با سبد خرید مطابقت ندارد."
    )
  }

  let verifiedRefId = refId || authority || `REF-${Date.now()}`
  const merchantId = process.env.ZARINPAL_MERCHANT_ID
  const effectiveAuthority = authority || session?.authority

  if (
    session?.provider === "zarinpal" &&
    merchantId &&
    effectiveAuthority
  ) {
    const response = await fetch(
      `${getZarinpalBaseUrl()}/pg/v4/payment/verify.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: Number(session.amount_irr ?? cart.total ?? 0),
          authority: effectiveAuthority,
        }),
      }
    )

    const payload = (await response.json()) as any
    if (![100, 101].includes(payload?.data?.code)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        payload?.errors?.message ||
          "تایید تراکنش از سمت درگاه پرداخت ناموفق بود."
      )
    }

    verifiedRefId = String(payload.data.ref_id ?? verifiedRefId)
  }

  const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
  const { result: order } = await we.run(completeCartWorkflowId, {
    input: { id: cart.id },
  })

  return {
    verified: true,
    order,
    tracking_ref: verifiedRefId,
  }
}

export const handleZibalCallback = async (
  scope: MedusaContainer,
  request: CallbackRequestInput
): Promise<CallbackRedirectResult> => {
  const platform = await getPaymentPlatform(scope)
  const { appUrl, environment } = platform.config

  const parsed = await platform.service
    .handleCallback("zibal", request)
    .catch(() => null)

  if (!parsed || !parsed.gatewayTransactionId) {
    return {
      statusCode: 302,
      status: "failed",
      paymentId: parsed?.paymentId,
      reason: "invalid_callback",
      redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
        payment_id: parsed?.paymentId,
        reason: "invalid_callback",
      }),
    }
  }

  const trackId = parsed.gatewayTransactionId
  const payment =
    parsed.payment ?? (await platform.paymentRepo.findByExternalId(trackId))

  if (!payment) {
    return {
      statusCode: 302,
      status: "failed",
      trackId,
      reason: "payment_not_found",
      redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
        track_id: trackId,
        reason: "payment_not_found",
      }),
    }
  }

  if (parsed.paymentId && parsed.paymentId !== payment.id) {
    return {
      statusCode: 302,
      status: "failed",
      paymentId: payment.id,
      trackId,
      reason: "invalid_callback",
      redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
        payment_id: payment.id,
        track_id: trackId,
        reason: "invalid_callback",
      }),
    }
  }

  const paymentTxs = await platform.transactionRepo.findByType(
    payment.id,
    TransactionType.PAYMENT
  )
  const storedTrackId = paymentTxs[paymentTxs.length - 1]?.gatewayTransactionId
  if (storedTrackId && String(storedTrackId) !== String(trackId)) {
    return {
      statusCode: 302,
      status: "failed",
      paymentId: payment.id,
      trackId,
      reason: "invalid_track_id",
      redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
        payment_id: payment.id,
        track_id: trackId,
        reason: "invalid_track_id",
      }),
    }
  }

  const existingLock = inFlightCallbacks.get(payment.id)
  if (existingLock) {
    return existingLock
  }

  const task = (async (): Promise<CallbackRedirectResult> => {
    const latestPayment =
      (await platform.paymentRepo.findById(payment.id)) ?? payment
    const cartId = latestPayment.metadata?.cart_id as string | undefined

    if (latestPayment.status === PaymentStatus.SUCCESS) {
      const verifyTxs = await platform.transactionRepo.findByType(
        latestPayment.id,
        TransactionType.VERIFY
      )
      const refId =
        verifyTxs[0]?.reference ||
        (latestPayment.metadata?.ref_id as string | undefined)
      let orderId = latestPayment.metadata?.order_id as string | undefined
      if (cartId) {
        const fulfilled = await completeCartIdempotently(scope, {
          cartId,
          paymentId: latestPayment.id,
          trackId,
          refId,
          platform,
        }).catch(() => null)
        orderId = fulfilled?.orderId || orderId
      }

      return {
        statusCode: 302,
        status: "success",
        paymentId: latestPayment.id,
        orderId,
        trackId,
        refId,
        redirectUrl: buildSuccessRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          order_id: orderId,
          track_id: trackId,
          ref_id: refId,
        }),
      }
    }

    if (
      latestPayment.status === PaymentStatus.FAILED ||
      latestPayment.status === PaymentStatus.CANCELLED
    ) {
      const reason =
        latestPayment.status === PaymentStatus.CANCELLED
          ? "cancelled"
          : (latestPayment.metadata?.failure_reason as string | undefined) ||
            "payment_failed"
      return {
        statusCode: 302,
        status:
          latestPayment.status === PaymentStatus.CANCELLED
            ? "cancelled"
            : "failed",
        paymentId: latestPayment.id,
        trackId,
        reason,
        redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          track_id: trackId,
          reason,
        }),
      }
    }

    if (!parsed.isSuccess) {
      const zibalCallbackStatus = Number(parsed.rawData?.status)
      const isCancelled = zibalCallbackStatus === 3
      const reason = isCancelled ? "cancelled" : "payment_failed"
      await persistPaymentTerminalState(
        platform,
        latestPayment.id,
        isCancelled ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
        {
          failure_reason: reason,
          callback_status: parsed.rawData?.status,
        }
      )

      return {
        statusCode: 302,
        status: isCancelled ? "cancelled" : "failed",
        paymentId: latestPayment.id,
        trackId,
        reason,
        redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          track_id: trackId,
          reason,
        }),
      }
    }

    try {
      // Never trust browser callback status=1/success=1 alone: verify server-side with Zibal
      const verifyResult = await platform.service.verifyPayment({
        paymentId: latestPayment.id,
        gatewayTransactionId: trackId,
        callbackData: parsed.rawData,
      })

      if (verifyResult.status !== PaymentStatus.SUCCESS) {
        await persistPaymentTerminalState(
          platform,
          latestPayment.id,
          PaymentStatus.FAILED,
          { failure_reason: "verification_failed" }
        )
        return {
          statusCode: 302,
          status: "failed",
          paymentId: latestPayment.id,
          trackId,
          reason: "verification_failed",
          redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
            payment_id: latestPayment.id,
            track_id: trackId,
            reason: "verification_failed",
          }),
        }
      }

      const refId = verifyResult.reference
      let orderId: string | undefined
      if (cartId) {
        const fulfilled = await completeCartIdempotently(scope, {
          cartId,
          paymentId: latestPayment.id,
          trackId,
          refId,
          platform,
        })
        orderId = fulfilled.orderId
      }

      return {
        statusCode: 302,
        status: "success",
        paymentId: latestPayment.id,
        orderId,
        trackId,
        refId,
        redirectUrl: buildSuccessRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          order_id: orderId,
          track_id: trackId,
          ref_id: refId,
        }),
      }
    } catch (err) {
      const reason = classifyFailureReason(err)
      await persistPaymentTerminalState(
        platform,
        latestPayment.id,
        PaymentStatus.FAILED,
        { failure_reason: reason }
      ).catch(() => undefined)

      return {
        statusCode: 302,
        status: "failed",
        paymentId: latestPayment.id,
        trackId,
        reason,
        redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          track_id: trackId,
          reason,
        }),
      }
    }
  })()

  inFlightCallbacks.set(payment.id, task)
  try {
    return await task
  } finally {
    if (inFlightCallbacks.get(payment.id) === task) {
      inFlightCallbacks.delete(payment.id)
    }
  }
}

export const inquireGatewayPayment = async (
  scope: MedusaContainer,
  paymentId: string
) => {
  const platform = await getPaymentPlatform(scope)
  let result
  try {
    result = await platform.service.inquirePayment(paymentId)
  } catch (err) {
    const message = sanitizeGatewayErrorMessage(err, platform.config.merchant)
    if (err instanceof Error && err.name === "RepositoryNotFoundError") {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, message)
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }

  return {
    payment_id: result.payment.id,
    status: result.status,
    amount: result.amount,
    reference: result.reference,
    track_id: result.gatewayTransactionId,
  }
}
