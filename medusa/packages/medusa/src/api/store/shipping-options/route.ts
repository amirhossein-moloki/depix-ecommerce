import { listShippingOptionsForCartWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest<{}, HttpTypes.StoreGetShippingOptionList>,
  res: MedusaResponse<HttpTypes.StoreShippingOptionListResponse>
) => {
  const { cart_id, is_return } = req.filterableFields

  const workflow = listShippingOptionsForCartWorkflow(req.scope)
  const { result: shipping_options } = await workflow.run({
    input: {
      cart_id,
      is_return: !!is_return,
      fields: req.queryConfig.fields,
    },
  })

  // Check active FreeShippingRule records to flag eligible options with is_free
  let hasStorewideFreeShipping = false
  try {
    const promotionService = req.scope.resolve<any>(Modules.PROMOTION)
    const cartService = req.scope.resolve<any>(Modules.CART)
    if (promotionService?.listFreeShippingRules && cart_id) {
      const [rules, cart] = await Promise.all([
        promotionService.listFreeShippingRules({ is_active: true }),
        cartService.retrieveCart(cart_id, { relations: ["items"] }).catch(() => null),
      ])

      const now = Date.now()
      const cartSubtotal = Number(cart?.subtotal ?? cart?.item_subtotal ?? 0)
      const cartProductIds = new Set<string>(
        (cart?.items ?? []).map((i: any) => i.product_id).filter(Boolean)
      )

      hasStorewideFreeShipping = (rules ?? []).some((rule: any) => {
        if (rule.starts_at && new Date(rule.starts_at).getTime() > now) {
          return false
        }
        if (rule.ends_at && new Date(rule.ends_at).getTime() < now) {
          return false
        }
        if (
          rule.min_purchase_amount != null &&
          cartSubtotal < Number(rule.min_purchase_amount)
        ) {
          return false
        }
        if (rule.scope === "store") {
          return true
        }
        if (rule.scope === "products" && Array.isArray(rule.product_ids)) {
          return rule.product_ids.some((pid: string) => cartProductIds.has(pid))
        }
        return false
      })
    }
  } catch {
    hasStorewideFreeShipping = false
  }

  const enriched = (shipping_options ?? []).map((opt: any) => {
    const amount = Number(
      opt?.calculated_price?.calculated_amount ?? opt?.amount ?? 0
    )
    const isFree = hasStorewideFreeShipping || amount === 0
    return {
      ...opt,
      amount: isFree ? 0 : amount,
      estimated_days: opt?.data?.estimated_days ?? opt?.metadata?.estimated_days ?? null,
      is_free: isFree,
    }
  })

  res.json({ shipping_options: enriched as any })
}
