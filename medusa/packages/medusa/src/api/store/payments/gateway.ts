import {
  Payment,
  PaymentStatus,
  TransactionType,
} from "@amirhossein-moloki/payment-core"
import { toZibalRialAmount } from "@amirhossein-moloki/payment-zibal"
import {
  completeCartWorkflowId,
  createOrderPaymentCollectionWorkflowId,
  getOrderDetailWorkflow,
  markPaymentCollectionAsPaidId,
  updateCartWorkflowId,
} from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import crypto from "crypto"
import { applyOrderStatusMetadata } from "../../utils/order-status"
import { attachAuthenticatedCustomerToCart } from "../carts/helpers"
import { defaultStoreRetrieveOrderFields } from "../orders/query-config"
import {
  buildFailedRedirectUrl,
  buildSuccessRedirectUrl,
} from "./config"
import { getPaymentPlatform, PaymentPlatformRuntime } from "./platform"
import { deductInventoryForCompletedOrder } from "./inventory-deduction"

export interface InitiatePaymentInput {
  cartId: string
  provider?: string
  callbackUrl?: string
  idempotencyKey?: string
  customerId?: string
}

export interface VerifyPaymentInput {
  cartId?: string
  paymentId?: string
  authority?: string
  trackId?: string
  refId?: string
  status?: string
  provider?: string
  customerId?: string
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
  errorDetail?: string
  gatewayCode?: string | number
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

/**
 * Safely parses numeric values that may arrive as primitives or Medusa BigNumber `{ value }` objects.
 */
function extractNumericAmount(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return fallback
    }
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (value && typeof value === "object") {
    const raw =
      (value as any).value ?? (value as any).numeric_ ?? (value as any).amount
    if (raw !== undefined && raw !== null) {
      return extractNumericAmount(raw, fallback)
    }
  }
  return fallback
}

async function updateCartMetadata(
  scope: MedusaContainer,
  cart: any,
  paymentSession: Record<string, unknown>
): Promise<void> {
  const nextMetadata = {
    ...(cart?.metadata ?? {}),
    payment_session: paymentSession,
  }

  let cartService: any = null
  try {
    cartService = scope.resolve<any>(Modules.CART)
  } catch {
    cartService = null
  }

  // Prefer direct metadata persistence so we do not trigger updateCartWorkflow ->
  // refreshCartShippingMethodsWorkflow and wipe dynamic shipping rates before payment.
  if (typeof cartService?.updateCarts === "function") {
    await cartService.updateCarts(cart.id, {
      metadata: nextMetadata,
    })
    return
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
  }
}

async function resolveExistingOrder(
  scope: MedusaContainer,
  orderId: string
): Promise<any> {
  try {
    const workflow = getOrderDetailWorkflow(scope)
    const { result } = await workflow.run({
      input: {
        order_id: orderId,
        fields: defaultStoreRetrieveOrderFields,
        filters: { is_draft_order: false },
      },
    })
    if (result) {
      return applyOrderStatusMetadata(result)
    }
  } catch {
    // Fall back to direct Order module lookup when query graph / workflow engine isn't wired (e.g. unit tests)
  }

  try {
    const orderService = scope.resolve<any>(Modules.ORDER)
    if (orderService?.retrieveOrder) {
      const order = await orderService.retrieveOrder(orderId)
      if (order) {
        return applyOrderStatusMetadata(order)
      }
    }
  } catch {
    // Return minimal order reference when order module is unavailable in unit tests
  }
  return { id: orderId }
}

async function ensureOrderPaymentCaptured(
  scope: MedusaContainer,
  params: {
    orderId: string
    amount?: number
  }
): Promise<void> {
  if (!params.orderId) {
    return
  }

  let queriedOrder: any = null
  try {
    const query = scope.resolve<any>(ContainerRegistrationKeys.QUERY)
    if (query?.graph) {
      const { data } = await query.graph({
        entity: "order",
        filters: { id: params.orderId },
        fields: [
          "id",
          "total",
          "currency_code",
          "payment_collections.id",
          "payment_collections.status",
          "payment_collections.amount",
          "payment_collections.captured_amount",
        ],
      })
      queriedOrder = Array.isArray(data) ? data[0] : data
    }
  } catch {
    queriedOrder = null
  }

  const verifiedPaidAmount = extractNumericAmount(params.amount, 0)
  const orderTotal = extractNumericAmount(queriedOrder?.total, 0)
  const captureAmount =
    verifiedPaidAmount > 0
      ? Math.round(verifiedPaidAmount)
      : Math.round(orderTotal)

  if (!Number.isFinite(captureAmount) || captureAmount <= 0) {
    return
  }

  const existingCollections: any[] = Array.isArray(
    queriedOrder?.payment_collections
  )
    ? queriedOrder.payment_collections
    : []

  const alreadyCaptured = existingCollections.some(
    (pc) =>
      pc?.status === "completed" ||
      Number(pc?.captured_amount ?? 0) >= captureAmount
  )
  if (alreadyCaptured) {
    return
  }

  let we: any = null
  try {
    we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
  } catch {
    return
  }
  if (!we?.run) {
    return
  }

  try {
    let paymentCollectionId = existingCollections.find(
      (pc) => pc?.status === "not_paid"
    )?.id as string | undefined

    if (!paymentCollectionId) {
      const pcRes = await we.run(createOrderPaymentCollectionWorkflowId, {
        input: {
          order_id: params.orderId,
          amount: captureAmount,
        },
      })
      paymentCollectionId = Array.isArray(pcRes?.result)
        ? pcRes.result[0]?.id
        : pcRes?.result?.id
    }

    if (paymentCollectionId) {
      await we.run(markPaymentCollectionAsPaidId, {
        input: {
          order_id: params.orderId,
          payment_collection_id: paymentCollectionId,
        },
      })
    }
  } catch (err) {
    console.error(
      "[Zibal] Failed to capture Medusa order payment collection:",
      {
        order_id: params.orderId,
        amount: captureAmount,
        detail: sanitizeGatewayErrorMessage(err),
      }
    )
  }
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

function stripAddressIds(addr: any): Record<string, unknown> | undefined {
  if (!addr || typeof addr !== "object") {
    return undefined
  }
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    deleted_at: _deletedAt,
    ...rest
  } = addr
  return rest
}

function buildOrderPromotionsSnapshot(cart: any): Array<{
  id?: string
  code: string
  type: string | null
  value: number | null
  is_automatic?: boolean
}> {
  return (cart?.promotions ?? [])
    .filter((p: any) => p?.code)
    .map((p: any) => ({
      ...(p.id ? { id: p.id } : {}),
      code: p.code,
      type: p?.application_method?.type ?? p?.type ?? null,
      value:
        p?.application_method?.value != null
          ? Number(p.application_method.value)
          : p?.value != null
            ? Number(p.value)
            : null,
      ...(p.is_automatic !== undefined ? { is_automatic: Boolean(p.is_automatic) } : {}),
    }))
}

function mapCartAdjustmentsForOrder(adjustments: any[] = []) {
  if (!Array.isArray(adjustments)) {
    return []
  }

  return adjustments
    .map((adj: any) => ({
      code: adj?.code ?? undefined,
      amount: Math.max(0, Math.round(extractNumericAmount(adj?.amount ?? adj?.raw_amount, 0))),
      description: adj?.description ?? undefined,
      promotion_id: adj?.promotion_id ?? undefined,
      provider_id: adj?.provider_id ?? undefined,
      is_tax_inclusive:
        adj?.is_tax_inclusive !== undefined ? Boolean(adj.is_tax_inclusive) : undefined,
    }))
    .filter((adj) => adj.amount > 0)
}

function mapCartTaxLinesForOrder(taxLines: any[] = []) {
  if (!Array.isArray(taxLines)) {
    return []
  }

  return taxLines.map((tl: any) => ({
    description: tl?.description ?? undefined,
    tax_rate_id: tl?.tax_rate_id ?? undefined,
    code: tl?.code ?? undefined,
    rate: extractNumericAmount(tl?.rate, 0),
    provider_id: tl?.provider_id ?? undefined,
    metadata: tl?.metadata ?? null,
    data: tl?.data ?? null,
  }))
}

function resolveCartDiscountTotal(cart: any): number {
  const explicitDiscount =
    cart?.discount_total !== undefined && cart?.discount_total !== null
      ? extractNumericAmount(cart.discount_total, NaN)
      : NaN
  if (Number.isFinite(explicitDiscount) && explicitDiscount >= 0) {
    return Math.round(explicitDiscount)
  }

  const itemAdjSum = (cart?.items ?? []).reduce(
    (sum: number, item: any) =>
      sum +
      (item?.adjustments ?? []).reduce(
        (s: number, adj: any) =>
          s + extractNumericAmount(adj?.amount ?? adj?.raw_amount, 0),
        0
      ),
    0
  )
  const shippingAdjSum = (cart?.shipping_methods ?? []).reduce(
    (sum: number, sm: any) =>
      sum +
      (sm?.adjustments ?? []).reduce(
        (s: number, adj: any) =>
          s + extractNumericAmount(adj?.amount ?? adj?.raw_amount, 0),
        0
      ),
    0
  )
  return Math.max(0, Math.round(itemAdjSum + shippingAdjSum))
}

function buildCartFinancialSnapshot(cart: any): {
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  total: number
} {
  const itemsSubtotal = Array.isArray(cart?.items) && cart.items.length > 0
    ? cart.items.reduce(
        (sum: number, item: any) =>
          sum +
          extractNumericAmount(item?.unit_price, 0) *
            extractNumericAmount(item?.quantity, 0),
        0
      )
    : extractNumericAmount(cart?.subtotal, 0)
  const subtotal = Math.round(
    cart?.subtotal !== undefined && cart?.subtotal !== null
      ? extractNumericAmount(cart.subtotal, itemsSubtotal)
      : itemsSubtotal
  )
  const discountTotal = resolveCartDiscountTotal(cart)
  const shippingTotal = Math.round(
    cart?.shipping_total !== undefined && cart?.shipping_total !== null
      ? extractNumericAmount(cart.shipping_total, 0)
      : (cart?.shipping_methods ?? []).reduce(
          (sum: number, sm: any) =>
            sum + extractNumericAmount(sm?.amount ?? sm?.raw_amount, 0),
          0
        )
  )
  const taxTotal = Math.round(extractNumericAmount(cart?.tax_total, 0))
  const total = Math.max(
    0,
    Math.round(
      cart?.total !== undefined && cart?.total !== null
        ? extractNumericAmount(cart.total, 0)
        : subtotal - discountTotal + taxTotal + shippingTotal
    )
  )

  return {
    subtotal,
    discount_total: discountTotal,
    shipping_total: shippingTotal,
    tax_total: taxTotal,
    total,
  }
}

async function createOrderFromCartFallback(
  scope: MedusaContainer,
  cart: any,
  params: {
    cartId: string
    paymentId?: string
    trackId?: string
    refId?: string
    amount?: number
    customerId?: string
  }
): Promise<any> {
  const orderService = scope.resolve<any>(Modules.ORDER)
  const items = (cart.items ?? []).map((item: any) => {
    const adjustments = mapCartAdjustmentsForOrder(item.adjustments ?? [])
    const taxLines = mapCartTaxLinesForOrder(item.tax_lines ?? [])
    return {
      title: item.title || "Item",
      subtitle: item.subtitle ?? undefined,
      thumbnail: item.thumbnail ?? undefined,
      quantity: extractNumericAmount(item.quantity, 1),
      variant_id: item.variant_id ?? undefined,
      variant_sku: item.variant_sku ?? undefined,
      variant_barcode: item.variant_barcode ?? undefined,
      variant_title: item.variant_title ?? undefined,
      product_id: item.product_id ?? undefined,
      product_title: item.product_title ?? undefined,
      product_description: item.product_description ?? undefined,
      product_subtitle: item.product_subtitle ?? undefined,
      product_handle: item.product_handle ?? undefined,
      requires_shipping: item.requires_shipping ?? true,
      is_discountable: item.is_discountable ?? true,
      is_tax_inclusive: item.is_tax_inclusive ?? false,
      unit_price: extractNumericAmount(item.unit_price, 0),
      compare_at_unit_price:
        item.compare_at_unit_price !== undefined &&
        item.compare_at_unit_price !== null
          ? extractNumericAmount(item.compare_at_unit_price, 0)
          : undefined,
      ...(adjustments.length > 0 ? { adjustments } : {}),
      ...(taxLines.length > 0 ? { tax_lines: taxLines } : {}),
      metadata: item.metadata ?? undefined,
    }
  })

  const shippingMethods = (cart.shipping_methods ?? []).map((sm: any) => {
    const adjustments = mapCartAdjustmentsForOrder(sm.adjustments ?? [])
    const taxLines = mapCartTaxLinesForOrder(sm.tax_lines ?? [])
    const numericAmount = extractNumericAmount(
      sm.amount,
      extractNumericAmount(sm.raw_amount, 0)
    )
    return {
      name: sm.name || "Standard Shipping",
      description: sm.description ?? undefined,
      amount: Math.max(0, Math.round(numericAmount)),
      is_tax_inclusive: sm.is_tax_inclusive ?? false,
      shipping_option_id: sm.shipping_option_id ?? undefined,
      data: sm.data ?? undefined,
      metadata: sm.metadata ?? undefined,
      ...(adjustments.length > 0 ? { adjustments } : {}),
      ...(taxLines.length > 0 ? { tax_lines: taxLines } : {}),
    }
  })

  const promotionsSnapshot = buildOrderPromotionsSnapshot(cart)
  const financialSnapshot = buildCartFinancialSnapshot(cart)

  // Defensive proportional discount allocation when cart has discount_total > 0
  // but item-level adjustments were missing or incomplete in the cart snapshot.
  const existingItemAdjTotal = items.reduce(
    (sum: number, item: any) =>
      sum +
      (item.adjustments ?? []).reduce(
        (s: number, adj: any) => s + extractNumericAmount(adj.amount, 0),
        0
      ),
    0
  )
  const existingShippingAdjTotal = shippingMethods.reduce(
    (sum: number, sm: any) =>
      sum +
      (sm.adjustments ?? []).reduce(
        (s: number, adj: any) => s + extractNumericAmount(adj.amount, 0),
        0
      ),
    0
  )
  const totalExistingAdjustments =
    existingItemAdjTotal + existingShippingAdjTotal
  const cartDiscountTotal = Math.max(
    0,
    Math.round(extractNumericAmount(cart.discount_total, financialSnapshot.discount_total))
  )

  if (cartDiscountTotal > totalExistingAdjustments && items.length > 0) {
    const shortfall = Math.round(cartDiscountTotal - totalExistingAdjustments)
    const discountable = items.filter((it: any) => it.is_discountable !== false)
    const targetItems = discountable.length > 0 ? discountable : items
    const weights = targetItems.map((it: any) =>
      Math.max(0, Number(it.unit_price ?? 0) * Number(it.quantity ?? 1))
    )
    const totalWeight = weights.reduce((a: number, b: number) => a + b, 0)
    const firstPromo = Array.isArray(cart.promotions) ? cart.promotions[0] : undefined
    const promoCode = firstPromo?.code ? String(firstPromo.code) : "DISCOUNT"
    const promoId = firstPromo?.id ? String(firstPromo.id) : undefined

    let allocated = 0
    targetItems.forEach((it: any, idx: number) => {
      const isLast = idx === targetItems.length - 1
      const share = isLast
        ? Math.max(0, shortfall - allocated)
        : totalWeight > 0
          ? Math.round((shortfall * weights[idx]) / totalWeight)
          : idx === 0
            ? shortfall
            : 0
      allocated += share
      if (share > 0) {
        it.adjustments = [
          ...(it.adjustments ?? []),
          {
            code: promoCode,
            amount: share,
            ...(promoId ? { promotion_id: promoId } : {}),
            description: "Cart discount adjustment",
          },
        ]
      }
    })
  }

  const promoCodes = Array.from(
    new Set(
      [
        ...items.flatMap((it: any) =>
          (it.adjustments ?? []).map((a: any) => a.code)
        ),
        ...shippingMethods.flatMap((sm: any) =>
          (sm.adjustments ?? []).map((a: any) => a.code)
        ),
        ...(cart.promotions ?? []).map((p: any) => p?.code),
      ].filter(Boolean)
    )
  )

  const verifiedAt = new Date().toISOString()
  const paidPaymentSession = {
    ...(cart.metadata?.payment_session ?? {}),
    payment_id: params.paymentId ?? cart.metadata?.payment_session?.payment_id,
    track_id: params.trackId ?? cart.metadata?.payment_session?.track_id,
    ref_id: params.refId ?? cart.metadata?.payment_session?.ref_id,
    amount_irr:
      params.amount && Number(params.amount) > 0
        ? Math.round(Number(params.amount))
        : (cart.metadata?.payment_session?.amount_irr ?? financialSnapshot.total),
    status: "paid",
    verified_at: verifiedAt,
  }

  const orderInput = {
    region_id: cart.region_id ?? undefined,
    customer_id: cart.customer_id ?? params.customerId ?? undefined,
    sales_channel_id: cart.sales_channel_id ?? undefined,
    status: "pending",
    email: cart.email ?? undefined,
    currency_code: cart.currency_code || "irr",
    locale: cart.locale ?? undefined,
    shipping_address: stripAddressIds(cart.shipping_address),
    billing_address: stripAddressIds(cart.billing_address),
    shipping_methods: shippingMethods,
    items,
    ...(promoCodes.length > 0 ? { promo_codes: promoCodes } : {}),
    metadata: {
      ...(cart.metadata ?? {}),
      cart_id: cart.id,
      payment_provider: "zibal",
      payment_id: params.paymentId,
      track_id: params.trackId,
      ref_id: params.refId,
      payment_status: "paid",
      payment_session: paidPaymentSession,
      promotions: promotionsSnapshot,
      financial_snapshot: financialSnapshot,
    },
  }

  const created = await orderService.createOrders([orderInput])
  const order = Array.isArray(created) ? created[0] : created

  if (order?.id) {
    try {
      const link = scope.resolve<any>(ContainerRegistrationKeys.LINK)
      if (link?.create) {
        const links: any[] = [
          {
            [Modules.CART]: { cart_id: cart.id },
            [Modules.ORDER]: { order_id: order.id },
          },
        ]
        for (const promo of cart.promotions ?? []) {
          if (promo?.id) {
            links.push({
              [Modules.ORDER]: { order_id: order.id },
              [Modules.PROMOTION]: { promotion_id: promo.id },
            })
          }
        }
        for (const linkDef of links) {
          await link.create(linkDef)
        }
      }
    } catch {
      // Optional link creation in custom checkout or unit-test scopes
    }
  }

  return order
}

async function completeCartIdempotently(
  scope: MedusaContainer,
  params: {
    cartId: string
    paymentId?: string
    trackId?: string
    refId?: string
    amount?: number
    customerId?: string
    platform?: PaymentPlatformRuntime
  }
): Promise<{ order: any; orderId?: string; alreadyFulfilled: boolean }> {
  const existingLock = inFlightCompletions.get(params.cartId)
  if (existingLock) {
    return existingLock
  }

  const task = (async () => {
    const cartService = scope.resolve<any>(Modules.CART)
    const cart = await retrieveFullCartForPayment(scope, params.cartId)

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
      if (existingOrderId) {
        await ensureOrderPaymentCaptured(scope, {
          orderId: existingOrderId,
          amount:
            params.amount ?? extractNumericAmount(cart.total, 0),
        })
      }
      const order = existingOrderId
        ? await resolveExistingOrder(scope, existingOrderId)
        : { id: existingOrderId }
      return {
        order,
        orderId: existingOrderId || order?.id,
        alreadyFulfilled: true,
      }
    }

    let order: any
    let usedFallback = false
    try {
      const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
      const wfRes = await we.run(completeCartWorkflowId, {
        input: { id: cart.id },
      })
      order = wfRes?.result
    } catch (wfErr) {
      console.warn(
        "[Zibal] completeCartWorkflow failed, falling back to direct order creation:",
        sanitizeGatewayErrorMessage(wfErr, params.platform?.config?.merchant)
      )
      order = await createOrderFromCartFallback(scope, cart, params)
      usedFallback = true
    }

    const orderId = order?.id ? String(order.id) : undefined
    const paidAmountIrr =
      params.amount && Number(params.amount) > 0
        ? Math.round(Number(params.amount))
        : cart.metadata?.payment_session?.amount_irr
    const nextSession = {
      ...(cart.metadata?.payment_session ?? {}),
      payment_id:
        params.paymentId || cart.metadata?.payment_session?.payment_id,
      track_id: params.trackId || cart.metadata?.payment_session?.track_id,
      ref_id: params.refId || cart.metadata?.payment_session?.ref_id,
      ...(paidAmountIrr !== undefined ? { amount_irr: paidAmountIrr } : {}),
      status: "paid",
      order_id: orderId,
      verified_at: new Date().toISOString(),
    }

    if (usedFallback && cartService?.updateCarts) {
      try {
        await cartService.updateCarts(cart.id, {
          completed_at: new Date(),
          metadata: {
            ...(cart.metadata ?? {}),
            payment_session: nextSession,
          },
        })
      } catch {
        // Fallback cart update failed; order_id is still persisted on payment metadata
      }
    } else {
      try {
        await updateCartMetadata(scope, cart, nextSession)
      } catch {
        // Completed cart updates may fail in some adapters; payment metadata still records order_id
      }
    }

    if (params.platform && params.paymentId && orderId) {
      await attachOrderMetadataToPayment(params.platform, params.paymentId, {
        order_id: orderId,
        ref_id: params.refId,
        track_id: params.trackId,
      }).catch(() => undefined)
    }

    if (orderId) {
      await ensureOrderPaymentCaptured(scope, {
        orderId,
        amount:
          params.amount ??
          extractNumericAmount(order?.total, extractNumericAmount(cart.total, 0)),
      })

      // Ensure promotions, financial_snapshot, and paid payment_session are persisted on order.metadata
      try {
        const orderService = scope.resolve<any>(Modules.ORDER)
        const existingMeta = (order?.metadata ?? {}) as Record<string, any>
        const promotionsSnapshot = buildOrderPromotionsSnapshot(cart)
        const financialSnapshot = buildCartFinancialSnapshot(cart)
        const existingSessionStatus = existingMeta?.payment_session?.status
        const needsMetadataSync =
          !existingMeta.financial_snapshot ||
          existingSessionStatus !== "paid" ||
          existingMeta?.payment_session?.order_id !== orderId ||
          existingMeta?.payment_status !== "paid" ||
          (promotionsSnapshot.length > 0 && !existingMeta.promotions)

        if (typeof orderService?.updateOrders === "function" && needsMetadataSync) {
          await orderService.updateOrders(orderId, {
            metadata: {
              ...existingMeta,
              payment_status: "paid",
              payment_session: nextSession,
              ...(promotionsSnapshot.length > 0
                ? { promotions: promotionsSnapshot }
                : {}),
              financial_snapshot:
                existingMeta.financial_snapshot ?? financialSnapshot,
            },
          })
        }
      } catch {
        // Optional metadata sync
      }

      await deductInventoryForCompletedOrder(scope, orderId, cart)

      const hydratedOrder = await resolveExistingOrder(scope, orderId)
      if (hydratedOrder && Object.keys(hydratedOrder).length > 1) {
        order = hydratedOrder
      }
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

function extractGatewayErrorDetail(
  err: unknown,
  secret?: string
): { detail: string; gatewayCode?: string | number } {
  const detail = sanitizeGatewayErrorMessage(err, secret)
  const gatewayCode =
    (err as any)?.details?.result ??
    (err as any)?.gatewayCode ??
    (err as any)?.code
  return {
    detail,
    gatewayCode:
      gatewayCode !== undefined && gatewayCode !== null
        ? gatewayCode
        : undefined,
  }
}

export function computeCartTotalIrr(cart: any): number {
  if (Array.isArray(cart?.items)) {
    if (cart.items.length === 0) {
      return 0
    }
    const itemsSubtotal = cart.items.reduce(
      (sum: number, item: any) =>
        sum +
        extractNumericAmount(item?.unit_price, 0) *
          extractNumericAmount(item?.quantity, 0),
      0
    )
    const discountTotal = resolveCartDiscountTotal(cart)
    const taxTotal = extractNumericAmount(cart.tax_total, 0)
    const shippingTotal =
      cart.shipping_total !== undefined && cart.shipping_total !== null
        ? extractNumericAmount(cart.shipping_total, 0)
        : (cart.shipping_methods ?? []).reduce(
            (sum: number, sm: any) =>
              sum + extractNumericAmount(sm?.amount ?? sm?.raw_amount, 0),
            0
          )

    return Math.max(
      0,
      Math.round(itemsSubtotal - discountTotal + taxTotal + shippingTotal)
    )
  }

  return Math.round(extractNumericAmount(cart?.total, 0))
}

function normalizeAmountToIrr(amount: number, currencyCode?: string | null): number {
  const normalized = String(currencyCode || "IRR")
    .trim()
    .toUpperCase()
  if (normalized === "IRT" || normalized === "TOMAN") {
    return Math.round(amount * 10)
  }
  return Math.round(amount)
}

async function retrieveFullCartForPayment(
  scope: MedusaContainer,
  cartId: string
): Promise<any> {
  try {
    const remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY)
    if (typeof remoteQuery === "function") {
      const queryObject = remoteQueryObjectFromString({
        entryPoint: "cart",
        variables: { filters: { id: cartId } },
        fields: [
          "id",
          "region_id",
          "sales_channel_id",
          "customer_id",
          "email",
          "currency_code",
          "locale",
          "completed_at",
          "total",
          "subtotal",
          "item_subtotal",
          "item_total",
          "item_discount_total",
          "discount_total",
          "shipping_discount_total",
          "tax_total",
          "shipping_total",
          "metadata",
          "shipping_address.*",
          "billing_address.*",
          "items.*",
          "items.adjustments.*",
          "items.tax_lines.*",
          "shipping_methods.*",
          "shipping_methods.adjustments.*",
          "shipping_methods.tax_lines.*",
          "promotions.id",
          "promotions.code",
          "promotions.is_automatic",
          "promotions.application_method.type",
          "promotions.application_method.value",
          "promotions.application_method.currency_code",
        ],
      })
      const [cart] = await remoteQuery(queryObject)
      if (cart) {
        return cart
      }
    }
  } catch {
    // Fall back to cartService when remoteQuery is not available (e.g. unit tests)
  }

  const cartService = scope.resolve<any>(Modules.CART)
  return await cartService
    .retrieveCart(cartId, {
      relations: [
        "items",
        "items.adjustments",
        "items.tax_lines",
        "shipping_methods",
        "shipping_methods.adjustments",
        "shipping_methods.tax_lines",
      ],
    })
    .catch(() =>
      cartService
        .retrieveCart(cartId, { relations: ["items", "shipping_methods"] })
        .catch(() => cartService.retrieveCart(cartId).catch(() => null))
    )
}

export const initiateGatewayPayment = async (
  scope: MedusaContainer,
  {
    cartId,
    provider = "zarinpal",
    callbackUrl,
    idempotencyKey,
    customerId,
  }: InitiatePaymentInput
) => {
  let cart = await retrieveFullCartForPayment(scope, cartId)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `سبد خرید با شناسه '${cartId}' یافت نشد.`
    )
  }

  if (customerId && !cart.customer_id) {
    const attached = await attachAuthenticatedCustomerToCart(
      scope,
      cartId,
      customerId
    )
    if (attached) {
      cart = (await retrieveFullCartForPayment(scope, cartId)) ?? cart
    }
  }

  const amountValue = computeCartTotalIrr(cart)
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
          customer_id: cart.customer_id ?? customerId ?? undefined,
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

  const amountIrr = normalizeAmountToIrr(
    amountValue,
    cart.currency_code ?? "IRR"
  )

  const merchantId = process.env.ZARINPAL_MERCHANT_ID
  if (normalizedProvider === "zarinpal" && merchantId) {
    const response = await fetch(
      `${getZarinpalBaseUrl()}/pg/v4/payment/request.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: amountIrr,
          currency: "IRR",
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
    amount_irr: amountIrr,
    callback_url: effectiveCallbackUrl,
    status: "pending",
    initiated_at: new Date().toISOString(),
  }

  await updateCartMetadata(scope, cart, paymentSession)

  return {
    payment_id: paymentId,
    redirect_url: redirectUrl,
    authority,
    amount_irr: amountIrr,
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
    customerId,
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
    const resolvedCustomerId =
      (payment.metadata?.customer_id as string | undefined) ?? customerId

    if (customerId && effectiveCartId) {
      await attachAuthenticatedCustomerToCart(scope, effectiveCartId, customerId)
    }

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
          amount: Number(payment.amount ?? cart?.total ?? 0),
          customerId: resolvedCustomerId,
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
      const reason = classifyFailureReason(err)
      const { detail, gatewayCode } = extractGatewayErrorDetail(
        err,
        platform.config.merchant
      )
      console.error("[Zibal] Verify payment failed:", {
        payment_id: payment.id,
        track_id: effectiveTrackId,
        reason,
        gateway_code: gatewayCode,
        error_detail: detail,
      })
      const metadataPatch: Record<string, unknown> = {
        failure_reason: reason,
        failure_detail: detail,
        ...(gatewayCode !== undefined ? { gateway_code: gatewayCode } : {}),
      }
      if (reason === "timeout") {
        await attachOrderMetadataToPayment(
          platform,
          payment.id,
          metadataPatch
        ).catch(() => undefined)
      } else {
        await persistPaymentTerminalState(
          platform,
          payment.id,
          PaymentStatus.FAILED,
          metadataPatch
        ).catch(() => undefined)
      }
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        gatewayCode !== undefined && !detail.includes(String(gatewayCode))
          ? `${detail} (code: ${gatewayCode})`
          : detail
      )
    }

    if (verifyResult.status !== PaymentStatus.SUCCESS) {
      const detail = sanitizeGatewayErrorMessage(
        (verifyResult as any)?.rawResponse?.message ||
          "تایید تراکنش از سمت درگاه زیبال ناموفق بود.",
        platform.config.merchant
      )
      console.error("[Zibal] Verify payment did not reach SUCCESS status:", {
        payment_id: payment.id,
        track_id: effectiveTrackId,
        reason: "verification_failed",
        error_detail: detail,
      })
      await persistPaymentTerminalState(
        platform,
        payment.id,
        PaymentStatus.FAILED,
        {
          failure_reason: "verification_failed",
          failure_detail: detail,
        }
      ).catch(() => undefined)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, detail)
    }

    const verifiedRef = verifyResult.reference || String(effectiveTrackId)
    let order: any = null
    if (effectiveCartId) {
      const fulfilled = await completeCartIdempotently(scope, {
        cartId: effectiveCartId,
        paymentId: payment.id,
        trackId: String(effectiveTrackId),
        refId: verifiedRef,
        amount: Number(payment.amount ?? cart?.total ?? 0),
        customerId: resolvedCustomerId,
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

  if (customerId && cart.id) {
    await attachAuthenticatedCustomerToCart(scope, cart.id, customerId)
  }

  const fullCart = (await retrieveFullCartForPayment(scope, cart.id)) ?? cart

  const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
  const { result: order } = await we.run(completeCartWorkflowId, {
    input: { id: cart.id },
  })

  const completedOrderId = order?.id ? String(order.id) : undefined
  if (completedOrderId) {
    try {
      const orderService = scope.resolve<any>(Modules.ORDER)
      const existingMeta = (order?.metadata ?? {}) as Record<string, any>
      const promotionsSnapshot = buildOrderPromotionsSnapshot(fullCart)
      const financialSnapshot = buildCartFinancialSnapshot(fullCart)
      const nextZarinpalSession = {
        ...(existingMeta.payment_session ?? session ?? {}),
        ref_id: verifiedRefId,
        order_id: completedOrderId,
        status: "paid",
        verified_at: new Date().toISOString(),
      }
      if (
        typeof orderService?.updateOrders === "function" &&
        (!existingMeta.financial_snapshot ||
          existingMeta?.payment_session?.status !== "paid" ||
          existingMeta?.payment_status !== "paid" ||
          (promotionsSnapshot.length > 0 && !existingMeta.promotions))
      ) {
        await orderService.updateOrders(completedOrderId, {
          metadata: {
            ...existingMeta,
            payment_status: "paid",
            payment_session: nextZarinpalSession,
            ...(promotionsSnapshot.length > 0
              ? { promotions: promotionsSnapshot }
              : {}),
            financial_snapshot:
              existingMeta.financial_snapshot ?? financialSnapshot,
          },
        })
      }
    } catch {
      // Optional metadata sync
    }

    await deductInventoryForCompletedOrder(scope, completedOrderId, fullCart)
  }

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
          amount: Number(latestPayment.amount ?? 0),
          customerId: latestPayment.metadata?.customer_id as string | undefined,
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

    let verifyResult
    try {
      // Never trust browser callback status=1/success=1 alone: verify server-side with Zibal
      verifyResult = await platform.service.verifyPayment({
        paymentId: latestPayment.id,
        gatewayTransactionId: trackId,
        callbackData: parsed.rawData,
      })
    } catch (err) {
      const reason = classifyFailureReason(err)
      const { detail, gatewayCode } = extractGatewayErrorDetail(
        err,
        platform.config.merchant
      )
      console.error("[Zibal] Callback verification failed:", {
        payment_id: latestPayment.id,
        track_id: trackId,
        reason,
        gateway_code: gatewayCode,
        error_detail: detail,
      })
      const metadataPatch: Record<string, unknown> = {
        failure_reason: reason,
        failure_detail: detail,
        ...(gatewayCode !== undefined ? { gateway_code: gatewayCode } : {}),
      }
      if (reason === "timeout") {
        // Keep non-terminal state on transient timeout so inquiry/retry can still settle it
        await attachOrderMetadataToPayment(
          platform,
          latestPayment.id,
          metadataPatch
        ).catch(() => undefined)
      } else {
        await persistPaymentTerminalState(
          platform,
          latestPayment.id,
          PaymentStatus.FAILED,
          metadataPatch
        ).catch(() => undefined)
      }

      return {
        statusCode: 302,
        status: "failed",
        paymentId: latestPayment.id,
        trackId,
        reason,
        errorDetail: detail,
        gatewayCode,
        redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          track_id: trackId,
          reason,
        }),
      }
    }

    if (verifyResult.status !== PaymentStatus.SUCCESS) {
      const detail = sanitizeGatewayErrorMessage(
        (verifyResult as any)?.rawResponse?.message ||
          "تایید تراکنش از سمت درگاه زیبال ناموفق بود.",
        platform.config.merchant
      )
      console.error("[Zibal] Callback verification did not reach SUCCESS status:", {
        payment_id: latestPayment.id,
        track_id: trackId,
        reason: "verification_failed",
        error_detail: detail,
      })
      await persistPaymentTerminalState(
        platform,
        latestPayment.id,
        PaymentStatus.FAILED,
        {
          failure_reason: "verification_failed",
          failure_detail: detail,
        }
      )
      return {
        statusCode: 302,
        status: "failed",
        paymentId: latestPayment.id,
        trackId,
        reason: "verification_failed",
        errorDetail: detail,
        redirectUrl: buildFailedRedirectUrl(appUrl, environment, {
          payment_id: latestPayment.id,
          track_id: trackId,
          reason: "verification_failed",
        }),
      }
    }

    // Zibal verification succeeded: fulfill order in its own try/catch so a cart completion
    // edge case never redirects an already-paid transaction to /payment/failed.
    const refId = verifyResult.reference
    let orderId = latestPayment.metadata?.order_id as string | undefined
    if (cartId) {
      try {
        const fulfilled = await completeCartIdempotently(scope, {
          cartId,
          paymentId: latestPayment.id,
          trackId,
          refId,
          amount: Number(latestPayment.amount ?? 0),
          customerId: latestPayment.metadata?.customer_id as string | undefined,
          platform,
        })
        orderId = fulfilled.orderId || orderId
      } catch (fulfillErr) {
        console.warn(
          "[Zibal] Payment verified cleanly, but cart completion failed:",
          sanitizeGatewayErrorMessage(fulfillErr, platform.config.merchant)
        )
      }
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

  const includeFailureInfo = result.status !== PaymentStatus.SUCCESS
  const failureReason = includeFailureInfo
    ? (result.payment.metadata?.failure_reason as string | undefined)
    : undefined
  const failureDetail = includeFailureInfo
    ? (result.payment.metadata?.failure_detail as string | undefined)
    : undefined
  const gatewayCode = includeFailureInfo
    ? (result.payment.metadata?.gateway_code as string | number | undefined)
    : undefined

  return {
    payment_id: result.payment.id,
    status: result.status,
    amount: result.amount,
    reference: result.reference,
    track_id: result.gatewayTransactionId,
    ...(failureReason ? { failure_reason: failureReason } : {}),
    ...(failureDetail ? { failure_detail: failureDetail } : {}),
    ...(gatewayCode !== undefined ? { gateway_code: gatewayCode } : {}),
  }
}
