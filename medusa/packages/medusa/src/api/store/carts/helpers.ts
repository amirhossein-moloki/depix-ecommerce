import { transferCartCustomerWorkflowId } from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getTotalVariantAvailability,
  getVariantAvailability,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

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
    cart.promotions = cart.promotions.map((promo: any) => ({
      ...promo,
      type: promo?.application_method?.type ?? promo?.type ?? null,
      value:
        promo?.application_method?.value != null
          ? Number(promo.application_method.value)
          : (promo?.value ?? null),
    }))
  }

  await enrichCartItemsWithInventoryQuantity(scope, cart)

  return cart
}
