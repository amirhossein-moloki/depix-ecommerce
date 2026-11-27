import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export interface FreeShippingStatus {
  has_active_rule: boolean
  is_eligible: boolean
  rule_title: string | null
  min_purchase_amount_irr: number | null
  remaining_amount_irr: number | null
}

function isRuleTimeActive(rule: any, now: number): boolean {
  if (rule.starts_at && new Date(rule.starts_at).getTime() > now) {
    return false
  }
  if (rule.ends_at && new Date(rule.ends_at).getTime() < now) {
    return false
  }
  return true
}

function isRuleWithinUsageLimit(rule: any): boolean {
  const rawLimit = rule?.usage_limit ?? rule?.metadata?.usage_limit
  if (rawLimit === null || rawLimit === undefined) {
    return true
  }
  const usageLimit = Number(rawLimit)
  if (!Number.isFinite(usageLimit) || usageLimit <= 0) {
    return true
  }
  const usedCount = Number(rule?.used_count ?? rule?.metadata?.used_count ?? 0)
  return (Number.isFinite(usedCount) ? usedCount : 0) < usageLimit
}

function isRuleScopeMatching(
  rule: any,
  cartProductIds: Set<string>,
  cartCategoryIds: Set<string>,
  cartCampaignIds: Set<string>
): boolean {
  if (rule.scope === "store") {
    return true
  }
  if (rule.scope === "products" && Array.isArray(rule.product_ids)) {
    return rule.product_ids.some((pid: string) => cartProductIds.has(pid))
  }
  if (rule.scope === "categories" && Array.isArray(rule.category_ids)) {
    return rule.category_ids.some((cid: string) => cartCategoryIds.has(cid))
  }
  if (rule.scope === "campaign" && rule.campaign_id) {
    return cartCampaignIds.has(String(rule.campaign_id))
  }
  return false
}

/**
 * Resolves the post-discount payable merchandise amount in IRR (excluding shipping)
 * so free-shipping thresholds are evaluated after discounts without shipping self-qualifying.
 */
export function resolveCartPayableAmountIrr(cart: any): number {
  if (!cart || typeof cart !== "object") {
    return 0
  }

  if (cart.item_total !== undefined && cart.item_total !== null) {
    const itemTotal = Number(cart.item_total)
    if (Number.isFinite(itemTotal)) {
      return Math.max(0, Math.round(itemTotal))
    }
  }

  if (cart.total !== undefined && cart.total !== null) {
    const total = Number(cart.total)
    if (Number.isFinite(total)) {
      const shippingTotal = Number(cart.shipping_total ?? 0)
      return Math.max(
        0,
        Math.round(total - (Number.isFinite(shippingTotal) ? shippingTotal : 0))
      )
    }
  }

  const rawSubtotal =
    cart.item_subtotal !== undefined && cart.item_subtotal !== null
      ? Number(cart.item_subtotal)
      : cart.subtotal !== undefined && cart.subtotal !== null
        ? Number(cart.subtotal)
        : Array.isArray(cart.items)
          ? cart.items.reduce(
              (sum: number, item: any) =>
                sum + Number(item?.unit_price ?? 0) * Number(item?.quantity ?? 0),
              0
            )
          : 0

  const explicitDiscount =
    cart.item_discount_total !== undefined && cart.item_discount_total !== null
      ? Number(cart.item_discount_total)
      : cart.discount_total !== undefined && cart.discount_total !== null
        ? Number(cart.discount_total)
        : Array.isArray(cart.items)
          ? cart.items.reduce(
              (sum: number, item: any) =>
                sum +
                (Array.isArray(item?.adjustments)
                  ? item.adjustments.reduce(
                      (s: number, adj: any) => s + Number(adj?.amount ?? 0),
                      0
                    )
                  : 0),
              0
            )
          : 0

  const safeSubtotal = Number.isFinite(rawSubtotal) ? rawSubtotal : 0
  const safeDiscount = Number.isFinite(explicitDiscount) ? explicitDiscount : 0
  return Math.max(0, Math.round(safeSubtotal - safeDiscount))
}

async function loadCartForFreeShipping(
  scope: MedusaContainer,
  cartOrId?: string | any
): Promise<any> {
  if (!cartOrId) {
    return null
  }
  if (typeof cartOrId !== "string") {
    return cartOrId
  }

  try {
    const remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY)
    if (typeof remoteQuery === "function") {
      const queryObj = remoteQueryObjectFromString({
        entryPoint: "cart",
        variables: { filters: { id: cartOrId } },
        fields: [
          "id",
          "total",
          "subtotal",
          "item_total",
          "item_subtotal",
          "discount_total",
          "item_discount_total",
          "shipping_total",
          "items.id",
          "items.product_id",
          "items.product.categories.id",
          "items.quantity",
          "items.unit_price",
          "items.adjustments.amount",
          "promotions.id",
          "promotions.campaign_id",
          "promotions.campaign.id",
        ],
      })
      const [queriedCart] = await remoteQuery(queryObj)
      if (queriedCart) {
        return queriedCart
      }
    }
  } catch {
    // Fall back to Modules.CART when remoteQuery is unavailable in unit tests
  }

  const cartService = scope.resolve<any>(Modules.CART)
  if (!cartService?.retrieveCart) {
    return null
  }
  return await cartService
    .retrieveCart(cartOrId, { relations: ["items", "items.adjustments"] })
    .catch(() =>
      cartService
        .retrieveCart(cartOrId, { relations: ["items"] })
        .catch(() => null)
    )
}

/**
 * Computes active free-shipping rule status and remaining threshold for a cart (or storewide).
 */
export async function getActiveFreeShippingStatus(
  scope: MedusaContainer,
  cartOrId?: string | any
): Promise<{ status: FreeShippingStatus; activeRules: any[] }> {
  const emptyStatus: FreeShippingStatus = {
    has_active_rule: false,
    is_eligible: false,
    rule_title: null,
    min_purchase_amount_irr: null,
    remaining_amount_irr: null,
  }

  try {
    const promotionService = scope.resolve<any>(Modules.PROMOTION)
    if (!promotionService?.listFreeShippingRules) {
      return { status: emptyStatus, activeRules: [] }
    }

    const rules = await promotionService.listFreeShippingRules({ is_active: true })
    const now = Date.now()
    const activeRules = (rules ?? []).filter(
      (r: any) => isRuleTimeActive(r, now) && isRuleWithinUsageLimit(r)
    )

    if (activeRules.length === 0) {
      return { status: emptyStatus, activeRules: [] }
    }

    const cart = await loadCartForFreeShipping(scope, cartOrId)
    const cartPayableAmount = resolveCartPayableAmountIrr(cart)
    const cartProductIds = new Set<string>(
      (cart?.items ?? []).map((i: any) => i.product_id).filter(Boolean)
    )
    const cartCategoryIds = new Set<string>(
      (cart?.items ?? [])
        .flatMap((i: any) => [
          ...(Array.isArray(i?.category_ids) ? i.category_ids : []),
          ...(Array.isArray(i?.product?.categories)
            ? i.product.categories.map((c: any) => c?.id)
            : []),
        ])
        .filter(Boolean)
    )
    const cartCampaignIds = new Set<string>(
      (cart?.promotions ?? [])
        .flatMap((p: any) => [p?.campaign_id, p?.campaign?.id])
        .filter(Boolean)
    )

    const eligibleRule = cart
      ? activeRules.find((rule: any) => {
          if (
            !isRuleScopeMatching(
              rule,
              cartProductIds,
              cartCategoryIds,
              cartCampaignIds
            )
          ) {
            return false
          }
          if (
            rule.min_purchase_amount != null &&
            cartPayableAmount < Number(rule.min_purchase_amount)
          ) {
            return false
          }
          const rawMaxPurchase =
            rule.max_purchase_amount ?? rule.metadata?.max_purchase_amount
          if (
            rawMaxPurchase != null &&
            Number.isFinite(Number(rawMaxPurchase)) &&
            cartPayableAmount > Number(rawMaxPurchase)
          ) {
            return false
          }
          return true
        })
      : undefined

    const displayRule =
      eligibleRule ??
      activeRules.find((r: any) => r.scope === "store") ??
      activeRules[0]

    const minPurchaseIrr =
      displayRule?.min_purchase_amount != null
        ? Number(displayRule.min_purchase_amount)
        : null

    const remainingAmountIrr = eligibleRule
      ? 0
      : minPurchaseIrr != null
        ? Math.max(0, minPurchaseIrr - cartPayableAmount)
        : null

    return {
      status: {
        has_active_rule: true,
        is_eligible: Boolean(eligibleRule),
        rule_title: displayRule?.title ?? null,
        min_purchase_amount_irr: minPurchaseIrr,
        remaining_amount_irr: remainingAmountIrr,
      },
      activeRules,
    }
  } catch {
    return { status: emptyStatus, activeRules: [] }
  }
}

/**
 * Evaluates active FreeShippingRule records against a cart's post-discount payable amount and items.
 */
export async function isCartEligibleForFreeShipping(
  scope: MedusaContainer,
  cartOrId: string | any
): Promise<boolean> {
  if (!cartOrId) {
    return false
  }
  const { status } = await getActiveFreeShippingStatus(scope, cartOrId)
  return status.is_eligible
}
