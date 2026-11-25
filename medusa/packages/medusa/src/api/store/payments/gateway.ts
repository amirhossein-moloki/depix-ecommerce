import {
  completeCartWorkflowId,
  updateCartWorkflowId,
} from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

export interface InitiatePaymentInput {
  cartId: string
  provider?: string
  callbackUrl: string
}

export interface VerifyPaymentInput {
  cartId: string
  authority?: string
  refId?: string
  status?: string
}

const getZarinpalBaseUrl = () =>
  process.env.ZARINPAL_SANDBOX === "true"
    ? "https://sandbox.zarinpal.com"
    : "https://api.zarinpal.com"

const getZarinpalStartPayBaseUrl = () =>
  process.env.ZARINPAL_SANDBOX === "true"
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://www.zarinpal.com/pg/StartPay"

export const initiateGatewayPayment = async (
  scope: MedusaContainer,
  { cartId, provider = "zarinpal", callbackUrl }: InitiatePaymentInput
) => {
  const cartService = scope.resolve<any>(Modules.CART)
  const cart = await cartService.retrieveCart(cartId).catch(() => null)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `سبد خرید با شناسه '${cartId}' یافت نشد.`
    )
  }

  const amountIrr = Number(cart.total ?? 0)
  if (!Number.isFinite(amountIrr) || amountIrr <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "مبلغ قابل پرداخت سبد خرید باید بیشتر از صفر ریال باشد."
    )
  }

  const paymentId = `pay_${crypto.randomBytes(10).toString("hex")}`
  let authority = `A000000000000000000000000000${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`
  let redirectUrl = `${callbackUrl}${callbackUrl.includes("?") ? "&" : "?"}Authority=${authority}&Status=OK`

  const merchantId = process.env.ZARINPAL_MERCHANT_ID
  if (provider === "zarinpal" && merchantId) {
    const response = await fetch(
      `${getZarinpalBaseUrl()}/pg/v4/payment/request.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: amountIrr,
          callback_url: callbackUrl,
          description: `پرداخت سفارش سبد ${cart.id}`,
          metadata: {
            email: cart.email ?? undefined,
            mobile: cart.shipping_address?.phone ?? cart.metadata?.phone ?? undefined,
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
    provider,
    amount_irr: amountIrr,
    callback_url: callbackUrl,
    status: "pending",
    initiated_at: new Date().toISOString(),
  }

  const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
  if (we?.run) {
    await we.run(updateCartWorkflowId, {
      input: {
        id: cart.id,
        metadata: {
          ...(cart.metadata ?? {}),
          payment_session: paymentSession,
        },
      },
    })
  } else {
    await cartService.updateCarts(cart.id, {
      metadata: {
        ...(cart.metadata ?? {}),
        payment_session: paymentSession,
      },
    })
  }

  return {
    payment_id: paymentId,
    redirect_url: redirectUrl,
    authority,
    amount_irr: amountIrr,
    provider,
  }
}

export const verifyGatewayPayment = async (
  scope: MedusaContainer,
  { cartId, authority, refId, status }: VerifyPaymentInput
) => {
  if (
    status &&
    ["nok", "failed", "canceled", "cancelled"].includes(status.toLowerCase())
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "پرداخت توسط کاربر لغو شد یا ناموفق بود."
    )
  }

  const cartService = scope.resolve<any>(Modules.CART)
  const cart = await cartService.retrieveCart(cartId).catch(() => null)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `سبد خرید با شناسه '${cartId}' یافت نشد.`
    )
  }

  const session = cart.metadata?.payment_session
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
        payload?.errors?.message || "تایید تراکنش از سمت درگاه پرداخت ناموفق بود."
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
