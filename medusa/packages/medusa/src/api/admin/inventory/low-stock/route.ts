import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

/**
 * @oas [get] /admin/inventory/low-stock
 * operationId: "AdminGetLowStockInventory"
 * summary: "Get Low Stock Products"
 * description: "Retrieves products or variants whose available stock is at or below the configured low-stock threshold."
 * x-authenticated: true
 * parameters:
 *   - (query) threshold {integer} Optional threshold override (default 5).
 *   - (query) location_id {string} Filter by location ID.
 *   - (query) limit {integer} Limit returned records (default 20).
 *   - (query) offset {integer} Offset returned records (default 0).
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             low_stock_items:
 *               type: array
 *               items:
 *                 type: object
 *             count:
 *               type: integer
 *             offset:
 *               type: integer
 *             limit:
 *               type: integer
 *   401:
 *     description: Unauthorized
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const queryParams = req.query || {}

  const threshold = parseInt((queryParams.threshold as string) || "5", 10)
  const locationId = queryParams.location_id as string
  const limit = Math.max(1, Math.min(100, parseInt((queryParams.limit as string) || "20", 10)))
  const offset = Math.max(0, parseInt((queryParams.offset as string) || "0", 10))

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  // Query products with variants and inventory items
  const productQuery = remoteQueryObjectFromString({
    entryPoint: "product",
    fields: [
      "id",
      "title",
      "status",
      "thumbnail",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.inventory_items.inventory_item_id",
    ],
  })

  const products = await remoteQuery(productQuery)

  const inventoryItemIds: string[] = []
  const itemVariantMap: Map<string, { product: any; variant: any }> = new Map()

  for (const product of products || []) {
    for (const variant of product.variants || []) {
      if (variant.inventory_items && variant.inventory_items.length > 0) {
        const item = variant.inventory_items[0]
        const itemId = item.inventory_item_id || item.inventory?.id
        if (itemId) {
          inventoryItemIds.push(itemId)
          itemVariantMap.set(itemId, { product, variant })
        }
      }
    }
  }

  const lowStockItems: any[] = []

  if (inventoryItemIds.length > 0) {
    const invQuery = remoteQueryObjectFromString({
      entryPoint: "inventory_items",
      variables: { filters: { id: inventoryItemIds } },
      fields: [
        "id",
        "sku",
        "stocked_quantity",
        "reserved_quantity",
        "location_levels.id",
        "location_levels.location_id",
        "location_levels.stocked_quantity",
        "location_levels.reserved_quantity",
        "location_levels.available_quantity",
      ],
    })

    const inventoryItems = await remoteQuery(invQuery)

    for (const item of inventoryItems) {
      const mapping = itemVariantMap.get(item.id)
      if (!mapping) continue

      let levels = item.location_levels || []
      if (locationId) {
        levels = levels.filter((l: any) => l.location_id === locationId)
      }

      let totalStocked = 0
      let totalReserved = 0
      let totalAvailable = 0

      for (const lvl of levels) {
        const stocked = Number(lvl.stocked_quantity || 0)
        const reserved = Number(lvl.reserved_quantity || 0)
        const available = Number(lvl.available_quantity ?? (stocked - reserved))

        totalStocked += stocked
        totalReserved += reserved
        totalAvailable += available
      }

      // Check low stock condition
      if (totalAvailable <= threshold) {
        lowStockItems.push({
          product_id: mapping.product.id,
          product_title: mapping.product.title,
          product_thumbnail: mapping.product.thumbnail,
          variant_id: mapping.variant.id,
          variant_title: mapping.variant.title,
          sku: mapping.variant.sku,
          inventory_item_id: item.id,
          stocked_quantity: totalStocked,
          reserved_quantity: totalReserved,
          available_quantity: totalAvailable,
          threshold,
          status: totalAvailable === 0 ? "out_of_stock" : "low_stock",
        })
      }
    }
  }

  const paginatedItems = lowStockItems.slice(offset, offset + limit)

  res.status(200).json({
    low_stock_items: paginatedItems,
    count: lowStockItems.length,
    offset,
    limit,
    threshold,
  })
}
