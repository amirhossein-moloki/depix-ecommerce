import { refreshCartItemsWorkflowId } from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

const STORE_PRICING_PROMOTION_CACHE_TAGS = [
  "promotion",
  "product",
  "product_variant",
  "price_list",
  "price",
  "price_set",
]

function parseTimestamp(value: unknown): number | null {
  if (!value) {
    return null
  }
  const ts = new Date(value as string | number | Date).getTime()
  return Number.isFinite(ts) ? ts : null
}

/**
 * Evaluates whether a promotion record is active, undeleted, within its scheduled window,
 * and attached to an active, in-window campaign (when present).
 */
export function isPromotionRecordActive(
  promo: any,
  nowMs = Date.now()
): boolean {
  if (!promo || promo.status !== "active" || promo.deleted_at) {
    return false
  }

  const metaStarts = parseTimestamp(promo.metadata?.starts_at)
  if (metaStarts !== null && metaStarts > nowMs) {
    return false
  }

  const metaEnds = parseTimestamp(promo.metadata?.ends_at)
  if (metaEnds !== null && metaEnds <= nowMs) {
    return false
  }

  if (promo.campaign) {
    if (promo.campaign.metadata?.is_active === false) {
      return false
    }
    const campStarts = parseTimestamp(promo.campaign.starts_at)
    if (campStarts !== null && campStarts > nowMs) {
      return false
    }
    const campEnds = parseTimestamp(promo.campaign.ends_at)
    if (campEnds !== null && campEnds <= nowMs) {
      return false
    }
  }

  return true
}

/**
 * Clears cached product, pricing, price-list, and promotion entries when available.
 */
export async function invalidateStorePricingAndPromotionCache(
  scope: MedusaContainer
): Promise<void> {
  try {
    const caching = scope.resolve<any>(Modules.CACHING, {
      allowUnregistered: true,
    })
    if (caching && typeof caching.clear === "function") {
      await caching
        .clear({ tags: STORE_PRICING_PROMOTION_CACHE_TAGS })
        .catch(() => undefined)
    }
  } catch {
    // Caching module is optional in some runtime/test configurations
  }
}

function buildPromotionFilterOr(
  promotionIds: string[],
  promotionCodes: string[]
): Record<string, any>[] {
  const orFilters: Record<string, any>[] = []
  if (promotionIds.length > 0) {
    orFilters.push({ promotion_id: promotionIds })
  }
  if (promotionCodes.length > 0) {
    orFilters.push({ code: promotionCodes })
  }
  return orFilters
}

async function resolveSafeRemoteQuery(scope: MedusaContainer): Promise<any> {
  try {
    const rq = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY, {
      allowUnregistered: true,
    })
    return typeof rq === "function" ? rq : null
  } catch {
    return null
  }
}

function extractRows(result: any): any[] {
  if (Array.isArray(result)) {
    return result
  }
  return Array.isArray(result?.rows) ? result.rows : []
}

function collectMatchingCartIdsFromCartRows(
  carts: any[],
  idSet: Set<string>,
  codeSet: Set<string>,
  openCartIds: Set<string>,
  completedCartIds: Set<string>
): void {
  for (const cart of carts) {
    if (!cart?.id) {
      continue
    }
    if (cart.completed_at) {
      completedCartIds.add(cart.id)
      continue
    }

    const promoMatch = (cart.promotions ?? []).some(
      (p: any) =>
        (p?.id && idSet.has(p.id)) || (p?.code && codeSet.has(p.code))
    )
    const itemAdjMatch = (cart.items ?? []).some((item: any) =>
      (item?.adjustments ?? []).some(
        (adj: any) =>
          (adj?.promotion_id && idSet.has(adj.promotion_id)) ||
          (adj?.code && codeSet.has(adj.code))
      )
    )
    const shipAdjMatch = (cart.shipping_methods ?? []).some((sm: any) =>
      (sm?.adjustments ?? []).some(
        (adj: any) =>
          (adj?.promotion_id && idSet.has(adj.promotion_id)) ||
          (adj?.code && codeSet.has(adj.code))
      )
    )

    if (promoMatch || itemAdjMatch || shipAdjMatch) {
      openCartIds.add(cart.id)
    }
  }
}

/**
 * Fallback cleanup that removes stale line-item/shipping adjustments and
 * dismisses `cart_promotion` links when workflow refresh cannot run.
 */
export async function cleanupCartPromotionFallback(
  scope: MedusaContainer,
  cartId: string,
  promotionIds: string[],
  promotionCodes: string[]
): Promise<void> {
  const idSet = new Set(promotionIds.filter(Boolean))
  const codeSet = new Set(promotionCodes.filter(Boolean))
  if (!cartId || (idSet.size === 0 && codeSet.size === 0)) {
    return
  }

  try {
    const cartService = scope.resolve<any>(Modules.CART, {
      allowUnregistered: true,
    })
    if (cartService?.retrieveCart) {
      const cart = await cartService
        .retrieveCart(cartId, {
          relations: [
            "items",
            "items.adjustments",
            "shipping_methods",
            "shipping_methods.adjustments",
          ],
        })
        .catch(() => null)

      if (cart && !cart.completed_at) {
        const lineAdjIds = (cart.items ?? [])
          .flatMap((it: any) => it?.adjustments ?? [])
          .filter(
            (adj: any) =>
              adj?.id &&
              ((adj.promotion_id && idSet.has(adj.promotion_id)) ||
                (adj.code && codeSet.has(adj.code)))
          )
          .map((adj: any) => adj.id)

        const shipAdjIds = (cart.shipping_methods ?? [])
          .flatMap((sm: any) => sm?.adjustments ?? [])
          .filter(
            (adj: any) =>
              adj?.id &&
              ((adj.promotion_id && idSet.has(adj.promotion_id)) ||
                (adj.code && codeSet.has(adj.code)))
          )
          .map((adj: any) => adj.id)

        if (
          lineAdjIds.length > 0 &&
          typeof cartService.deleteLineItemAdjustments === "function"
        ) {
          await cartService
            .deleteLineItemAdjustments(lineAdjIds)
            .catch(() => undefined)
        }
        if (
          shipAdjIds.length > 0 &&
          typeof cartService.deleteShippingMethodAdjustments === "function"
        ) {
          await cartService
            .deleteShippingMethodAdjustments(shipAdjIds)
            .catch(() => undefined)
        }
      }
    }
  } catch {
    // Cart service unavailable
  }

  try {
    const remoteLink = scope.resolve<any>(ContainerRegistrationKeys.LINK, {
      allowUnregistered: true,
    })
    if (remoteLink && typeof remoteLink.dismiss === "function" && idSet.size > 0) {
      const links = Array.from(idSet).map((promotionId) => ({
        [Modules.CART]: { cart_id: cartId },
        [Modules.PROMOTION]: { promotion_id: promotionId },
      }))
      await remoteLink.dismiss(links).catch(() => undefined)
    }
  } catch {
    // Link service unavailable
  }
}

/**
 * Clears store pricing/promotion caches and refreshes every open (uncompleted) cart
 * referencing any updated, deactivated, or deleted promotion ID/code.
 */
export async function reconcileCartsForPromotionChange(
  scope: MedusaContainer,
  opts: {
    promotionIds?: string[]
    promotionCodes?: string[]
    forceRefreshPrices?: boolean
  }
): Promise<string[]> {
  await invalidateStorePricingAndPromotionCache(scope)

  const promotionIds = Array.from(
    new Set((opts.promotionIds ?? []).filter(Boolean))
  )
  const promotionCodes = Array.from(
    new Set((opts.promotionCodes ?? []).filter(Boolean))
  )

  if (promotionIds.length === 0 && promotionCodes.length === 0) {
    return []
  }

  const idSet = new Set(promotionIds)
  const codeSet = new Set(promotionCodes)
  const candidateCartIds = new Set<string>()
  const openCartIds = new Set<string>()
  const completedCartIds = new Set<string>()

  const remoteQuery = await resolveSafeRemoteQuery(scope)

  if (remoteQuery && promotionIds.length > 0) {
    try {
      const links = extractRows(
        await remoteQuery(
          remoteQueryObjectFromString({
            entryPoint: "cart_promotion",
            variables: { promotion_id: promotionIds },
            fields: ["cart_id", "promotion_id"],
          })
        )
      )
      for (const link of links) {
        if (link?.cart_id) {
          candidateCartIds.add(link.cart_id)
        }
      }
    } catch {
      // Ignore if cart_promotion entryPoint is unavailable in minimal mocks
    }
  }

  try {
    const cartService = scope.resolve<any>(Modules.CART, {
      allowUnregistered: true,
    })
    const orFilters = buildPromotionFilterOr(promotionIds, promotionCodes)

    if (
      cartService &&
      orFilters.length > 0 &&
      typeof cartService.listLineItemAdjustments === "function"
    ) {
      const itemAdjs = await cartService
        .listLineItemAdjustments({ $or: orFilters }, { relations: ["item"] })
        .catch(() => [])
      for (const adj of itemAdjs ?? []) {
        if (adj?.item?.cart_id) {
          candidateCartIds.add(adj.item.cart_id)
        }
      }
    }

    if (
      cartService &&
      orFilters.length > 0 &&
      typeof cartService.listShippingMethodAdjustments === "function"
    ) {
      const shipAdjs = await cartService
        .listShippingMethodAdjustments(
          { $or: orFilters },
          { relations: ["shipping_method"] }
        )
        .catch(() => [])
      for (const adj of shipAdjs ?? []) {
        if (adj?.shipping_method?.cart_id) {
          candidateCartIds.add(adj.shipping_method.cart_id)
        }
      }
    }
  } catch {
    // Cart service unavailable
  }

  if (remoteQuery) {
    try {
      const openCarts = extractRows(
        await remoteQuery(
          remoteQueryObjectFromString({
            entryPoint: "cart",
            variables: {
              filters: { completed_at: null },
              take: 200,
            },
            fields: [
              "id",
              "completed_at",
              "promotions.id",
              "promotions.code",
              "items.adjustments.id",
              "items.adjustments.promotion_id",
              "items.adjustments.code",
              "shipping_methods.adjustments.id",
              "shipping_methods.adjustments.promotion_id",
              "shipping_methods.adjustments.code",
            ],
          })
        )
      )
      collectMatchingCartIdsFromCartRows(
        openCarts,
        idSet,
        codeSet,
        openCartIds,
        completedCartIds
      )
    } catch {
      // Ignore if cart query fails
    }
  }

  const unresolvedCandidates = Array.from(candidateCartIds).filter(
    (id) => !openCartIds.has(id) && !completedCartIds.has(id)
  )

  if (unresolvedCandidates.length > 0 && remoteQuery) {
    try {
      const carts = extractRows(
        await remoteQuery(
          remoteQueryObjectFromString({
            entryPoint: "cart",
            variables: {
              filters: { id: unresolvedCandidates },
            },
            fields: ["id", "completed_at"],
          })
        )
      )
      for (const cart of carts) {
        if (cart?.id) {
          if (cart.completed_at) {
            completedCartIds.add(cart.id)
          } else {
            openCartIds.add(cart.id)
          }
        }
      }
    } catch {
      // Fall back below via cartService
    }
  }

  const stillUnresolved = Array.from(candidateCartIds).filter(
    (id) => !openCartIds.has(id) && !completedCartIds.has(id)
  )
  if (stillUnresolved.length > 0) {
    try {
      const cartService = scope.resolve<any>(Modules.CART, {
        allowUnregistered: true,
      })
      for (const cartId of stillUnresolved) {
        const cart = await cartService?.retrieveCart?.(cartId).catch(() => null)
        if (cart?.completed_at) {
          completedCartIds.add(cartId)
        } else {
          openCartIds.add(cartId)
        }
      }
    } catch {
      for (const cartId of stillUnresolved) {
        openCartIds.add(cartId)
      }
    }
  }

  const targetCartIds = Array.from(openCartIds).filter(
    (id) => !completedCartIds.has(id)
  )
  if (targetCartIds.length === 0) {
    return []
  }

  let workflowEngine: any = null
  try {
    workflowEngine = scope.resolve<any>(Modules.WORKFLOW_ENGINE, {
      allowUnregistered: true,
    })
  } catch {
    workflowEngine = null
  }

  const reconciledIds: string[] = []
  for (const cartId of targetCartIds) {
    let refreshed = false
    if (workflowEngine && typeof workflowEngine.run === "function") {
      try {
        await workflowEngine.run(refreshCartItemsWorkflowId, {
          input: {
            cart_id: cartId,
            force_refresh: Boolean(opts.forceRefreshPrices),
          },
        })
        refreshed = true
      } catch {
        refreshed = false
      }
    }

    if (!refreshed) {
      await cleanupCartPromotionFallback(
        scope,
        cartId,
        promotionIds,
        promotionCodes
      )
    }
    reconciledIds.push(cartId)
  }

  return reconciledIds
}

/**
 * Clears pricing caches and refreshes all open carts with line items after a PriceList mutation.
 */
export async function reconcileOpenCartsForPriceListChange(
  scope: MedusaContainer
): Promise<string[]> {
  await invalidateStorePricingAndPromotionCache(scope)

  const remoteQuery = await resolveSafeRemoteQuery(scope)
  if (!remoteQuery) {
    return []
  }

  let openCarts: any[] = []
  try {
    openCarts = extractRows(
      await remoteQuery(
        remoteQueryObjectFromString({
          entryPoint: "cart",
          variables: {
            filters: { completed_at: null },
            take: 200,
          },
          fields: ["id", "completed_at", "items.id"],
        })
      )
    )
  } catch {
    return []
  }

  let workflowEngine: any = null
  try {
    workflowEngine = scope.resolve<any>(Modules.WORKFLOW_ENGINE, {
      allowUnregistered: true,
    })
  } catch {
    return []
  }

  if (!workflowEngine || typeof workflowEngine.run !== "function") {
    return []
  }

  const reconciledIds: string[] = []
  for (const cart of openCarts) {
    if (!cart?.id || cart.completed_at || !(cart.items?.length > 0)) {
      continue
    }
    try {
      await workflowEngine.run(refreshCartItemsWorkflowId, {
        input: {
          cart_id: cart.id,
          force_refresh: true,
        },
      })
      reconciledIds.push(cart.id)
    } catch {
      // Keep processing remaining open carts
    }
  }

  return reconciledIds
}
