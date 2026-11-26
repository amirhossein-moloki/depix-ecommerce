import {
  createInventoryLevelsWorkflow,
  linkProductsToSalesChannelWorkflow,
} from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Ensures a newly created product is linked to the store's default sales channel
 * and that any managed-inventory variants without location levels get an initial
 * inventory level at the default stock location (using `variant.metadata.initial_stock`
 * or `0`).
 */
export async function ensureProductDefaultInventoryAndChannel(
  scope: MedusaContainer,
  productId: string
): Promise<void> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id", "default_location_id"],
  })
  const store = stores?.[0]
  const defaultSalesChannelId = store?.default_sales_channel_id || "sc_default"
  let defaultLocationId: string | undefined = store?.default_location_id || undefined

  if (!defaultLocationId) {
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id"],
    })
    defaultLocationId = locations?.[0]?.id
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "sales_channels.id",
      "variants.id",
      "variants.manage_inventory",
      "variants.metadata",
      "variants.inventory_items.inventory_item_id",
      "variants.inventory_items.inventory.location_levels.id",
      "variants.inventory_items.inventory.location_levels.location_id",
    ],
    filters: { id: productId },
  })

  const product = products?.[0]
  if (!product) {
    return
  }

  const isLinkedToDefaultChannel = (product.sales_channels || []).some(
    (sc: any) => sc?.id === defaultSalesChannelId
  )
  if (!isLinkedToDefaultChannel && defaultSalesChannelId) {
    await linkProductsToSalesChannelWorkflow(scope).run({
      input: {
        id: defaultSalesChannelId,
        add: [product.id],
      },
    })
  }

  if (!defaultLocationId) {
    return
  }

  const levelsToCreate: Array<{
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }> = []

  for (const variant of product.variants || []) {
    if (variant?.manage_inventory === false) {
      continue
    }

    const rawStock = Number(variant?.metadata?.initial_stock)
    const stockedQuantity =
      Number.isFinite(rawStock) && rawStock >= 0 ? Math.floor(rawStock) : 0

    for (const invLink of variant?.inventory_items || []) {
      const inventoryItemId = invLink?.inventory_item_id
      if (!inventoryItemId) {
        continue
      }

      const existingLevels = invLink?.inventory?.location_levels || []
      const hasLocationLevel = existingLevels.some(
        (lvl: any) => lvl?.location_id === defaultLocationId
      )
      if (!hasLocationLevel) {
        levelsToCreate.push({
          inventory_item_id: inventoryItemId,
          location_id: defaultLocationId,
          stocked_quantity: stockedQuantity,
        })
      }
    }
  }

  if (levelsToCreate.length > 0) {
    await createInventoryLevelsWorkflow(scope).run({
      input: {
        inventory_levels: levelsToCreate,
      },
    })
  }
}
