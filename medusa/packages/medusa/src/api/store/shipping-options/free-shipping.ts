import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

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

function isRuleScopeMatching(rule: any, cartProductIds: Set<string>): boolean {
  if (rule.scope === "store") {
    return true
  }
  if (rule.scope === "products" && Array.isArray(rule.product_ids)) {
    return rule.product_ids.some((pid: string) => cartProductIds.has(pid))
  }
  return false
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
    const activeRules = (rules ?? []).filter((r: any) => isRuleTimeActive(r, now))

    if (activeRules.length === 0) {
      return { status: emptyStatus, activeRules: [] }
    }

    let cart = typeof cartOrId === "string" ? null : cartOrId
    if (!cart && typeof cartOrId === "string") {
      const cartService = scope.resolve<any>(Modules.CART)
      cart = await cartService
        .retrieveCart(cartOrId, { relations: ["items"] })
        .catch(() => null)
    }

    const cartSubtotal = Number(cart?.subtotal ?? cart?.item_subtotal ?? 0)
    const cartProductIds = new Set<string>(
      (cart?.items ?? []).map((i: any) => i.product_id).filter(Boolean)
    )

    const eligibleRule = cart
      ? activeRules.find((rule: any) => {
          if (!isRuleScopeMatching(rule, cartProductIds)) {
            return false
          }
          if (
            rule.min_purchase_amount != null &&
            cartSubtotal < Number(rule.min_purchase_amount)
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
        ? Math.max(0, minPurchaseIrr - cartSubtotal)
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
 * Evaluates active FreeShippingRule records against a cart's subtotal and items.
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
