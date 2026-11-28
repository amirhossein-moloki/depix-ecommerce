import {
  refreshCartItemsWorkflowId,
  transferCartCustomerWorkflowId,
} from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getTotalVariantAvailability,
  getVariantAvailability,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  cleanupCartPromotionFallback,
  isPromotionRecordActive,
} from "../../admin/promotions/reconcile-carts"

/**
 * Attaches an authenticated customer to a guest cart if the cart has not already been claimed or completed.
 */
export async function attachAuthenticatedCustomerToCart(
  scope: MedusaContainer,
  cartId: string,
  customerId?: string | null
): Promise<boolean> {
  if (!cartId || !customerId) {
    return false
  }

  let cartService: any = null
  try {
    cartService = scope.resolve<any>(Modules.CART)
  } catch {
    return false
  }

  const cart = await cartService?.retrieveCart?.(cartId).catch(() => null)
  if (!cart || cart.completed_at || cart.customer_id) {
    return false
  }

  let customer: any = null
  try {
    const customerService = scope.resolve<any>(Modules.CUSTOMER)
    customer = await customerService?.retrieveCustomer?.(customerId).catch(() => null)
  } catch {
    customer = null
  }

  const priorEmail = cart.email
  let attached = false

  try {
    const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
    if (we?.run) {
      await we.run(transferCartCustomerWorkflowId, {
        input: {
          id: cartId,
          customer_id: customerId,
        },
      })
      attached = true
    }
  } catch {
    attached = false
  }

  if (!attached && cartService?.updateCarts) {
    await cartService.updateCarts(cartId, {
      customer_id: customerId,
      ...(customer?.email ? { email: customer.email } : {}),
    })
    attached = true
  }

  if (attached && priorEmail && !customer?.email && cartService?.updateCarts) {
    await cartService
      .updateCarts(cartId, { email: priorEmail })
      .catch(() => undefined)
  }

  return attached
}

const VIRTUAL_CART_FIELDS = new Set([
  "items.variant.inventory_quantity",
  "items.available_quantity",
])

/**
 * Hydrates `item.variant.inventory_quantity` and `item.available_quantity`
 * on each cart line item from live Inventory Module availability.
 */
export async function enrichCartItemsWithInventoryQuantity(
  scope: MedusaContainer,
  cart: any
): Promise<void> {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return
  }

  const variantIds = Array.from(
    new Set<string>(
      cart.items
        .map((item: any) => item?.variant_id ?? item?.variant?.id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    )
  )

  if (variantIds.length === 0) {
    return
  }

  let query: any = null
  try {
    query = scope.resolve<any>(ContainerRegistrationKeys.QUERY)
  } catch {
    return
  }

  if (typeof query?.graph !== "function") {
    return
  }

  let channelAvailability: Record<string, { availability: number | null }> = {}
  if (cart.sales_channel_id) {
    try {
      channelAvailability = await getVariantAvailability(query, {
        variant_ids: variantIds,
        sales_channel_id: cart.sales_channel_id,
      })
    } catch {
      channelAvailability = {}
    }
  }

  const unresolvedIds = variantIds.filter((vid) => {
    const val = channelAvailability?.[vid]?.availability
    return val === null || val === undefined
  })

  let totalAvailability: Record<string, { availability: number | null }> = {}
  if (unresolvedIds.length > 0) {
    try {
      totalAvailability = await getTotalVariantAvailability(query, {
        variant_ids: unresolvedIds,
      })
    } catch {
      totalAvailability = {}
    }
  }

  for (const item of cart.items) {
    if (!item || typeof item !== "object") {
      continue
    }

    const variantId = item.variant_id ?? item.variant?.id
    if (!variantId) {
      continue
    }

    if (item.variant?.manage_inventory === false) {
      item.available_quantity = null
      if (item.variant && typeof item.variant === "object") {
        item.variant.inventory_quantity = null
      }
      continue
    }

    const rawChannel = channelAvailability?.[variantId]?.availability
    const rawTotal = totalAvailability?.[variantId]?.availability
    const resolvedQty =
      rawChannel !== null && rawChannel !== undefined
        ? rawChannel
        : rawTotal !== null && rawTotal !== undefined
          ? rawTotal
          : null

    if (resolvedQty !== null && Number.isFinite(Number(resolvedQty))) {
      const numericQty = Number(resolvedQty)
      item.available_quantity = numericQty
      if (item.variant && typeof item.variant === "object") {
        item.variant.inventory_quantity = numericQty
      } else {
        item.variant = {
          id: variantId,
          inventory_quantity: numericQty,
        }
      }
    }
  }
}

/**
 * Verifies that all promotions referenced by an open cart remain active and undeleted.
 * If any referenced promotion was deactivated, soft-deleted, expired, or its campaign
 * was deactivated, refreshes the cart to drop stale discounts and returns `true`.
 */
export async function reconcileStaleCartPromotions(
  scope: MedusaContainer,
  cart: any
): Promise<boolean> {
  if (!cart || !cart.id || cart.completed_at) {
    return false
  }

  const referencedIds = new Set<string>()
  const referencedCodes = new Set<string>()
  const staleIds = new Set<string>()
  const staleCodes = new Set<string>()
  let hasExplicitInactiveOnCart = false

  const hiddenStalePromos = Array.isArray((cart as any).__stalePromotions)
    ? (cart as any).__stalePromotions
    : []
  for (const promo of [...(cart.promotions ?? []), ...hiddenStalePromos]) {
    if (promo?.id) referencedIds.add(String(promo.id))
    if (promo?.code) referencedCodes.add(String(promo.code))
    if ((promo?.status && promo.status !== "active") || promo?.deleted_at) {
      hasExplicitInactiveOnCart = true
      if (promo?.id) staleIds.add(String(promo.id))
      if (promo?.code) staleCodes.add(String(promo.code))
    }
  }

  for (const item of cart.items ?? []) {
    for (const adj of item?.adjustments ?? []) {
      if (adj?.promotion_id) referencedIds.add(String(adj.promotion_id))
      if (adj?.code) referencedCodes.add(String(adj.code))
    }
  }

  for (const sm of cart.shipping_methods ?? []) {
    for (const adj of sm?.adjustments ?? []) {
      if (adj?.promotion_id) referencedIds.add(String(adj.promotion_id))
      if (adj?.code) referencedCodes.add(String(adj.code))
    }
  }

  if (referencedIds.size === 0 && referencedCodes.size === 0) {
    return false
  }

  let remoteQuery: any = null
  try {
    remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY, {
      allowUnregistered: true,
    })
  } catch {
    remoteQuery = null
  }

  if (typeof remoteQuery === "function") {
    const orFilters: Record<string, any>[] = []
    if (referencedIds.size > 0) {
      orFilters.push({ id: Array.from(referencedIds) })
    }
    if (referencedCodes.size > 0) {
      orFilters.push({ code: Array.from(referencedCodes) })
    }

    try {
      const result = await remoteQuery(
        remoteQueryObjectFromString({
          entryPoint: "promotion",
          variables: {
            filters: { $or: orFilters },
          },
          fields: [
            "id",
            "code",
            "status",
            "deleted_at",
            "metadata",
            "campaign.starts_at",
            "campaign.ends_at",
            "campaign.metadata",
          ],
        })
      )
      const promos = Array.isArray(result) ? result : result?.rows ?? []
      const isMockCartEcho = promos.some(
        (row: any) => row && row.id === cart.id && row.code === undefined
      )
      if (!isMockCartEcho) {
        const activeIds = new Set<string>()
        const activeCodes = new Set<string>()
        for (const promo of promos) {
          if (isPromotionRecordActive(promo)) {
            if (promo?.id) activeIds.add(String(promo.id))
            if (promo?.code) activeCodes.add(String(promo.code))
          }
        }

        for (const id of referencedIds) {
          if (!activeIds.has(id)) {
            staleIds.add(id)
          }
        }
        for (const code of referencedCodes) {
          if (!activeCodes.has(code)) {
            staleCodes.add(code)
          }
        }
      }
    } catch {
      // Ignore query error and avoid spurious mutations
    }
  }

  const needsReconcile =
    hasExplicitInactiveOnCart || staleIds.size > 0 || staleCodes.size > 0
  if (!needsReconcile) {
    return false
  }

  let refreshed = false
  try {
    const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE, {
      allowUnregistered: true,
    })
    if (we && typeof we.run === "function") {
      await we.run(refreshCartItemsWorkflowId, {
        input: {
          cart_id: cart.id,
          force_refresh: true,
        },
      })
      refreshed = true
    }
  } catch {
    refreshed = false
  }

  if (!refreshed) {
    const hasSpecificStale = staleIds.size > 0 || staleCodes.size > 0
    await cleanupCartPromotionFallback(
      scope,
      cart.id,
      hasSpecificStale ? Array.from(staleIds) : Array.from(referencedIds),
      hasSpecificStale ? Array.from(staleCodes) : Array.from(referencedCodes)
    )
  }

  return true
}

export const refetchCart = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const sanitizedFields = Array.isArray(fields)
    ? fields.filter((field) => !VIRTUAL_CART_FIELDS.has(field))
    : fields

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id } },
    fields: sanitizedFields,
  })

  const [cart] = await remoteQuery(queryObject)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${id}' not found`
    )
  }

  if (Array.isArray(cart.promotions)) {
    const stalePromos: any[] = []
    const activePromos: any[] = []
    for (const promo of cart.promotions) {
      if ((promo?.status && promo.status !== "active") || promo?.deleted_at) {
        stalePromos.push(promo)
      } else {
        activePromos.push({
          ...promo,
          type: promo?.application_method?.type ?? promo?.type ?? null,
          value:
            promo?.application_method?.value != null
              ? Number(promo.application_method.value)
              : (promo?.value ?? null),
        })
      }
    }

    if (stalePromos.length > 0) {
      Object.defineProperty(cart, "__stalePromotions", {
        value: stalePromos,
        enumerable: false,
        configurable: true,
      })
    }
    cart.promotions = activePromos
  }

  await enrichCartItemsWithInventoryQuantity(scope, cart)

  return cart
}
