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
          fields: ["id", "product_id", "inventory_items.inventory_item_id"],
          filters: { id: variantId },
        })
        .catch(() => ({ data: [] }))

      const invItems = variants?.[0]?.inventory_items ?? []
      for (const link of invItems) {
        if (!link?.inventory_item_id) {
          continue
        }
        const updatedLevel = await inventoryService.adjustInventory(
          link.inventory_item_id,
          defaultLocationId,
          qty
        )
        if (typeof inventoryService.createInventoryTransaction === "function") {
          const quantityAfter = Number(updatedLevel?.stocked_quantity ?? qty)
          const quantityBefore = Math.max(0, quantityAfter - qty)
          await inventoryService
            .createInventoryTransaction({
              inventory_item_id: link.inventory_item_id,
              inventory_level_id: updatedLevel?.id ?? null,
              product_id:
                variants?.[0]?.product_id ?? item?.item?.product_id ?? null,
              variant_id: variantId,
              location_id: defaultLocationId,
              quantity_before: quantityBefore,
              quantity_change: qty,
              quantity_after: quantityAfter,
              type: "increase",
              reason: "return",
              note: ret?.id
                ? `Return ${ret.id} restocked`
                : "Return restocked",
              reference_type: "return",
              reference_id: ret?.id ?? null,
              created_by: ret?.metadata?.inspected_by ?? "admin",
            })
            .catch(() => undefined)
        }
        restoredItems++
      }
    }
  } catch {
    // Inventory adjustment is best-effort if inventory module is unconfigured
  }

  return restoredItems
}
