import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"
import { processStockAvailabilityWorkflow } from "@medusajs/core-flows"

export default async function stockAlertInventoryHandler({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER, {
    allowUnregistered: true,
  })
  const query = container.resolve(ContainerRegistrationKeys.QUERY, {
    allowUnregistered: true,
  })

  const payload = event.data || {}
  const inventoryItemId = payload.inventory_item_id || payload.id

  if (!inventoryItemId) {
    return
  }

  try {
    let variantIds: string[] = []
    if (query) {
      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "inventory_items.inventory_item_id"],
        filters: {
          inventory_items: {
            inventory_item_id: inventoryItemId,
          },
        },
      })
      variantIds = (variants || []).map((v: any) => v.id)
    }

    if (variantIds.length === 0 && payload.variant_id) {
      variantIds = [payload.variant_id]
    }

    for (const variantId of variantIds) {
      await processStockAvailabilityWorkflow(container).run({
        input: {
          variant_id: variantId,
          inventory_item_id: inventoryItemId,
        },
      })
    }
  } catch (err: any) {
    logger?.error?.(
      `Failed to process stock alert inventory event ${event.name}: ${err.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    "inventory.inventory-level.created",
    "inventory.inventory-level.updated",
    "inventory.reservation-item.deleted",
    "inventory.reservation-item.updated",
    "inventory.inventory-item.updated",
  ],
  context: {
    subscriberId: "stock-alert-inventory-subscriber",
  },
}
