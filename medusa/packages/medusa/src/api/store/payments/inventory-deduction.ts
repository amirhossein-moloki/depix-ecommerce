import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

async function resolveDefaultLocationId(
  remoteQuery: any
): Promise<string | undefined> {
  try {
    const storeQuery = remoteQueryObjectFromString({
      entryPoint: "store",
      fields: ["id", "default_location_id"],
    })
    const stores = await remoteQuery(storeQuery)
    return stores?.[0]?.default_location_id || undefined
  } catch {
    return undefined
  }
}

async function resolveOrderItems(
  scope: MedusaContainer,
  orderId: string,
  cartOrOrder?: any
): Promise<{
  items: Array<{
    id?: string
    cart_item_id?: string
    variant_id?: string
    product_id?: string
    quantity: number
  }>
  customerId?: string | null
}> {
  const cartItems = Array.isArray(cartOrOrder?.items) ? cartOrOrder.items : []
  let orderRecord: any = null

  try {
    const orderService = scope.resolve<any>(Modules.ORDER)
    if (orderService?.retrieveOrder) {
      orderRecord = await orderService
        .retrieveOrder(orderId, { relations: ["items"] })
        .catch(() => null)
    }
  } catch {
    orderRecord = null
  }

  const orderItems = Array.isArray(orderRecord?.items) ? orderRecord.items : []
  const sourceItems = orderItems.length > 0 ? orderItems : cartItems

  const mapped = sourceItems.map((item: any) => {
    const matchingCartItem = cartItems.find(
      (ci: any) => ci?.variant_id && ci.variant_id === item?.variant_id
    )
    return {
      id: item?.id,
      cart_item_id: matchingCartItem?.id,
      variant_id: item?.variant_id ?? matchingCartItem?.variant_id,
      product_id: item?.product_id ?? matchingCartItem?.product_id,
      quantity: Math.max(0, Math.floor(Number(item?.quantity ?? 0))),
    }
  })

  return {
    items: mapped,
    customerId: orderRecord?.customer_id ?? cartOrOrder?.customer_id ?? null,
  }
}

async function releaseLineItemReservations(
  inventoryService: any,
  lineItemIds: string[]
): Promise<void> {
  const uniqueIds = Array.from(new Set(lineItemIds.filter(Boolean)))
  if (uniqueIds.length === 0) {
    return
  }

  if (typeof inventoryService.deleteReservationItemsByLineItem === "function") {
    for (const lineItemId of uniqueIds) {
      await inventoryService
        .deleteReservationItemsByLineItem(lineItemId)
        .catch(() => undefined)
    }
    return
  }

  if (
    typeof inventoryService.listReservationItems === "function" &&
    typeof inventoryService.deleteReservationItems === "function"
  ) {
    const reservations = await inventoryService
      .listReservationItems({ line_item_id: uniqueIds })
      .catch(() => [])
    const reservationIds = (reservations ?? [])
      .map((r: any) => r?.id)
      .filter(Boolean)
    if (reservationIds.length > 0) {
      await inventoryService
        .deleteReservationItems(reservationIds)
        .catch(() => undefined)
    }
  }
}

/**
 * Deducts real stocked_quantity in the Inventory Module and logs an immutable
 * InventoryTransaction (type: "decrease", reason: "sale") for each line item of a completed order.
 * Idempotent per order_id.
 */
export async function deductInventoryForCompletedOrder(
  scope: MedusaContainer,
  orderId: string,
  cartOrOrder?: any
): Promise<void> {
  if (!orderId) {
    return
  }

  let inventoryService: any
  let remoteQuery: any
  try {
    inventoryService = scope.resolve<any>(Modules.INVENTORY)
    remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY)
  } catch {
    return
  }

  if (
    (!inventoryService?.adjustInventory &&
      !inventoryService?.updateInventoryLevels) ||
    !inventoryService?.createInventoryTransaction ||
    typeof remoteQuery !== "function"
  ) {
    return
  }

  // Idempotency guard: skip if sale transactions already recorded for this order
  if (typeof inventoryService.listInventoryTransactions === "function") {
    const existingTx = await inventoryService
      .listInventoryTransactions(
        { reference_type: "order", reference_id: orderId, reason: "sale" },
        { take: 1 }
      )
      .catch(() => [])
    if (Array.isArray(existingTx) && existingTx.length > 0) {
      return
    }
  }

  const { items, customerId } = await resolveOrderItems(
    scope,
    orderId,
    cartOrOrder
  )
  if (items.length === 0) {
    return
  }

  let cachedDefaultLocationId: string | undefined
  let resolvedDefaultLocation = false

  for (const item of items) {
    const variantId = item.variant_id
    const qty = item.quantity
    if (!variantId || qty <= 0) {
      continue
    }

    try {
      const variantQuery = remoteQueryObjectFromString({
        entryPoint: "product_variant",
        variables: { filters: { id: variantId } },
        fields: [
          "id",
          "product_id",
          "manage_inventory",
          "inventory_items.inventory_item_id",
        ],
      })
      const [variant] = await remoteQuery(variantQuery)
      if (!variant || variant.manage_inventory === false) {
        continue
      }

      const inventoryItemId =
        variant.inventory_items?.[0]?.inventory_item_id ||
        variant.inventory_items?.[0]?.inventory?.id
      if (!inventoryItemId) {
        continue
      }

      const invQuery = remoteQueryObjectFromString({
        entryPoint: "inventory_items",
        variables: { filters: { id: inventoryItemId } },
        fields: [
          "id",
          "location_levels.id",
          "location_levels.location_id",
          "location_levels.stocked_quantity",
          "location_levels.reserved_quantity",
        ],
      })
      const [invItem] = await remoteQuery(invQuery)
      const levels = invItem?.location_levels ?? []
      if (levels.length === 0) {
        continue
      }

      let level = levels[0]
      if (levels.length > 1) {
        if (!resolvedDefaultLocation) {
          cachedDefaultLocationId = await resolveDefaultLocationId(remoteQuery)
          resolvedDefaultLocation = true
        }
        if (cachedDefaultLocationId) {
          level =
            levels.find((l: any) => l.location_id === cachedDefaultLocationId) ??
            levels[0]
        }
      }

      if (!level?.location_id) {
        continue
      }

      // Release any reservation created by completeCartWorkflow for this line item so
      // available_quantity (stocked - reserved) is not double-deducted.
      await releaseLineItemReservations(
        inventoryService,
        [item.id, item.cart_item_id].filter(Boolean) as string[]
      )

      const currentStocked = Number(level.stocked_quantity ?? 0)
      const resultingStock = Math.max(0, currentStocked - qty)
      const actualChange = resultingStock - currentStocked

      if (actualChange !== 0) {
        if (typeof inventoryService.adjustInventory === "function") {
          await inventoryService.adjustInventory(
            inventoryItemId,
            level.location_id,
            actualChange
          )
        } else {
          await inventoryService.updateInventoryLevels([
            {
              inventory_item_id: inventoryItemId,
              location_id: level.location_id,
              stocked_quantity: resultingStock,
            },
          ])
        }
      }

      await inventoryService.createInventoryTransaction({
        inventory_item_id: inventoryItemId,
        inventory_level_id: level.id ?? null,
        product_id: item.product_id ?? variant.product_id ?? null,
        variant_id: variantId,
        location_id: level.location_id,
        quantity_before: currentStocked,
        quantity_change: actualChange,
        quantity_after: resultingStock,
        type: "decrease",
        reason: "sale",
        note: `Order ${orderId} completed`,
        reference_type: "order",
        reference_id: orderId,
        created_by: customerId ?? "system",
      })
    } catch {
      // Never block order completion if a single variant's inventory log fails
    }
  }
}

/**
 * Restores stocked_quantity and logs InventoryTransaction (type: "increase", reason: "cancellation")
 * for any inventory previously deducted for the canceled order. Idempotent per order_id.
 */
export async function restoreInventoryForCanceledOrder(
  scope: MedusaContainer,
  orderId: string,
  actorId?: string | null
): Promise<void> {
  if (!orderId) {
    return
  }

  let inventoryService: any
  let remoteQuery: any
  try {
    inventoryService = scope.resolve<any>(Modules.INVENTORY)
    remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY)
  } catch {
    return
  }

  if (
    typeof inventoryService?.listInventoryTransactions !== "function" ||
    !inventoryService?.createInventoryTransaction
  ) {
    return
  }

  // Idempotency guard: skip if cancellation restoration was already recorded
  const existingCancelTx = await inventoryService
    .listInventoryTransactions(
      {
        reference_type: "order",
        reference_id: orderId,
        reason: "cancellation",
      },
      { take: 1 }
    )
    .catch(() => [])
  if (Array.isArray(existingCancelTx) && existingCancelTx.length > 0) {
    return
  }

  // Only restore quantities that were actually deducted from stocked_quantity on sale
  const saleTransactions = await inventoryService
    .listInventoryTransactions({
      reference_type: "order",
      reference_id: orderId,
      reason: "sale",
    })
    .catch(() => [])

  if (!Array.isArray(saleTransactions) || saleTransactions.length === 0) {
    return
  }

  for (const tx of saleTransactions) {
    const restoreQty = Math.abs(Number(tx?.quantity_change ?? 0))
    const inventoryItemId = tx?.inventory_item_id
    const locationId = tx?.location_id
    if (!inventoryItemId || !locationId || restoreQty <= 0) {
      continue
    }

    try {
      let currentStocked = Number(tx?.quantity_after ?? 0)
      let levelId = tx?.inventory_level_id ?? null

      if (typeof remoteQuery === "function") {
        const invQuery = remoteQueryObjectFromString({
          entryPoint: "inventory_items",
          variables: { filters: { id: inventoryItemId } },
          fields: [
            "id",
            "location_levels.id",
            "location_levels.location_id",
            "location_levels.stocked_quantity",
          ],
        })
        const [invItem] = await remoteQuery(invQuery).catch(() => [])
        const level = (invItem?.location_levels ?? []).find(
          (l: any) => l.location_id === locationId
        )
        if (level) {
          currentStocked = Number(level.stocked_quantity ?? 0)
          levelId = level.id ?? levelId
        }
      }

      const resultingStock = currentStocked + restoreQty

      if (typeof inventoryService.adjustInventory === "function") {
        await inventoryService.adjustInventory(
          inventoryItemId,
          locationId,
          restoreQty
        )
      } else if (typeof inventoryService.updateInventoryLevels === "function") {
        await inventoryService.updateInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: resultingStock,
          },
        ])
      }

      await inventoryService.createInventoryTransaction({
        inventory_item_id: inventoryItemId,
        inventory_level_id: levelId,
        product_id: tx.product_id ?? null,
        variant_id: tx.variant_id ?? null,
        location_id: locationId,
        quantity_before: currentStocked,
        quantity_change: restoreQty,
        quantity_after: resultingStock,
        type: "increase",
        reason: "cancellation",
        note: `Order ${orderId} canceled`,
        reference_type: "order",
        reference_id: orderId,
        created_by: actorId ?? "system",
      })
    } catch {
      // Never block order cancellation if restoring one level fails
    }
  }
}
