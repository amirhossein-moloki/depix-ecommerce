import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const formatReturnRequest = (ret: any) => {
  if (!ret) {
    return ret
  }

  const metadata = ret.metadata ?? {}
  return {
    ...ret,
    status: metadata.rma_status || ret.status || "requested",
    medusa_status: ret.status,
    reason: metadata.reason ?? null,
    description: metadata.description ?? null,
    evidence_urls: Array.isArray(metadata.evidence_urls)
      ? metadata.evidence_urls
      : [],
    shipment: metadata.shipment ?? null,
    admin_note: metadata.admin_note ?? null,
    reject_reason: metadata.reject_reason ?? null,
    inspection: metadata.inspection ?? null,
    refund: metadata.refund ?? null,
    customer_id: metadata.customer_id ?? ret.order?.customer_id ?? null,
  }
}

export const restoreSellableReturnInventory = async (
  scope: MedusaContainer,
  ret: any
): Promise<number> => {
  let restoredItems = 0
  const items = ret?.items ?? []
  if (!items.length) {
    return restoredItems
  }

  try {
    const query = scope.resolve<any>("query")
    const inventoryService = scope.resolve<any>(Modules.INVENTORY)
    if (!query?.graph || !inventoryService) {
      return restoredItems
    }

    let defaultLocationId = ret.location_id as string | undefined
    if (!defaultLocationId) {
      try {
        const stockLocationService = scope.resolve<any>(Modules.STOCK_LOCATION)
        const locations = await stockLocationService.listStockLocations(
          {},
          { take: 1 }
        )
        defaultLocationId = locations?.[0]?.id
      } catch {
        defaultLocationId = undefined
      }
    }

    if (!defaultLocationId) {
      return restoredItems
    }

    for (const item of items) {
      const qty = Number(item?.quantity) || 0
      const variantId = item?.item?.variant_id || item?.variant_id
      if (!qty || !variantId) {
        continue
      }

      const { data: variants } = await query
        .graph({
          entity: "product_variant",
          fields: ["id", "inventory_items.inventory_item_id"],
          filters: { id: variantId },
        })
        .catch(() => ({ data: [] }))

      const invItems = variants?.[0]?.inventory_items ?? []
      for (const link of invItems) {
        if (!link?.inventory_item_id) {
          continue
        }
        await inventoryService.adjustInventory(
          link.inventory_item_id,
          defaultLocationId,
          qty
        )
        restoredItems++
      }
    }
  } catch {
    // Inventory adjustment is best-effort if inventory module is unconfigured
  }

  return restoredItems
}
