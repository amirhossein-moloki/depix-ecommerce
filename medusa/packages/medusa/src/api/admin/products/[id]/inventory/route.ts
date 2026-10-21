import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

/**
 * @oas [get] /admin/products/{id}/inventory
 * operationId: "AdminGetProductInventory"
 * summary: "Get Product Inventory"
 * description: "Retrieves current stock levels and inventory information for all variants of a product."
 * x-authenticated: true
 * parameters:
 *   - (path) id* {string} The ID of the product.
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product_id:
 *               type: string
 *             variants:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   sku:
 *                     type: string
 *                   inventory_item_id:
 *                     type: string
 *                   stocked_quantity:
 *                     type: integer
 *                   reserved_quantity:
 *                     type: integer
 *                   available_quantity:
 *                     type: integer
 *                   locations:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         location_id:
 *                           type: string
 *                         stocked_quantity:
 *                           type: integer
 *                         reserved_quantity:
 *                           type: integer
 *                         available_quantity:
 *                           type: integer
 *   404:
 *     description: Product Not Found
 *   401:
 *     description: Unauthorized
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: productId } = req.params
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  // 1. Fetch product with variants and inventory items
  const query = remoteQueryObjectFromString({
    entryPoint: "product",
    variables: { id: productId },
    fields: [
      "id",
      "title",
      "status",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.inventory_items.inventory_item_id",
    ],
  })

  const [product] = await remoteQuery(query)

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} not found`
    )
  }

  const inventoryItemIds: string[] = []
  const variantInventoryMap: Map<string, string> = new Map()

  for (const variant of product.variants || []) {
    if (variant.inventory_items && variant.inventory_items.length > 0) {
      const item = variant.inventory_items[0]
      const itemId = item.inventory_item_id || item.inventory?.id
      if (itemId) {
        inventoryItemIds.push(itemId)
        variantInventoryMap.set(variant.id, itemId)
      }
    }
  }

  let inventoryLevelsMap: Map<string, any[]> = new Map()

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
      inventoryLevelsMap.set(item.id, item.location_levels || [])
    }
  }

  const variantsResult = (product.variants || []).map((variant: any) => {
    const itemId = variantInventoryMap.get(variant.id)
    const levels = itemId ? inventoryLevelsMap.get(itemId) || [] : []

    let totalStocked = 0
    let totalReserved = 0
    let totalAvailable = 0

    const locations = levels.map((lvl: any) => {
      const stocked = Number(lvl.stocked_quantity || 0)
      const reserved = Number(lvl.reserved_quantity || 0)
      const available = Number(lvl.available_quantity ?? (stocked - reserved))

      totalStocked += stocked
      totalReserved += reserved
      totalAvailable += available

      return {
        id: lvl.id,
        location_id: lvl.location_id,
        stocked_quantity: stocked,
        reserved_quantity: reserved,
        available_quantity: available,
      }
    })

    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      inventory_item_id: itemId || null,
      stocked_quantity: totalStocked,
      reserved_quantity: totalReserved,
      available_quantity: totalAvailable,
      locations,
    }
  })

  res.status(200).json({
    product_id: product.id,
    title: product.title,
    variants: variantsResult,
  })
}
