import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

const VALID_TYPES = ["increase", "decrease"]
const VALID_REASONS = [
  "initial_stock",
  "purchase",
  "sale",
  "cancellation",
  "return",
  "damaged",
  "manual_adjustment",
  "inventory_count",
]

/**
 * @oas [post] /admin/products/{id}/inventory/adjustments
 * operationId: "AdminAdjustProductInventory"
 * summary: "Adjust Product Inventory"
 * description: "Increases or decreases inventory stock for a product or variant and records an immutable inventory transaction."
 * x-authenticated: true
 * parameters:
 *   - (path) id* {string} The ID of the product.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - type
 *           - quantity
 *           - reason
 *         properties:
 *           type:
 *             type: string
 *             enum: [increase, decrease]
 *           quantity:
 *             type: integer
 *             minimum: 1
 *           reason:
 *             type: string
 *             enum: [initial_stock, purchase, sale, cancellation, return, damaged, manual_adjustment, inventory_count]
 *           variant_id:
 *             type: string
 *           location_id:
 *             type: string
 *           note:
 *             type: string
 *           reference_type:
 *             type: string
 *           reference_id:
 *             type: string
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             product_id:
 *               type: string
 *             variant_id:
 *               type: string
 *             location_id:
 *               type: string
 *             quantity_before:
 *               type: integer
 *             quantity_change:
 *               type: integer
 *             quantity_after:
 *               type: integer
 *             transaction:
 *               type: object
 *   400:
 *     description: Bad Request / Validation Error
 *   401:
 *     description: Unauthorized
 *   404:
 *     description: Product or Variant Not Found
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: productId } = req.params
  const body = req.body as any || {}
  const {
    type,
    quantity,
    reason,
    variant_id,
    location_id,
    note,
    reference_type,
    reference_id,
  } = body

  // Validation
  if (!type || !VALID_TYPES.includes(type)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid adjustment type. Must be one of: ${VALID_TYPES.join(", ")}`
    )
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Quantity must be a positive integer"
    )
  }

  if (!reason || !VALID_REASONS.includes(reason)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid reason. Must be one of: ${VALID_REASONS.join(", ")}`
    )
  }

  if (reason === "manual_adjustment" && (!note || typeof note !== "string" || !note.trim())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "An explanatory note is required for manual stock adjustments"
    )
  }

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)

  // Retrieve Product
  const productQuery = remoteQueryObjectFromString({
    entryPoint: "product",
    variables: { id: productId },
    fields: [
      "id",
      "title",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.inventory_items.inventory_item_id",
    ],
  })

  const [product] = await remoteQuery(productQuery)

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} not found`
    )
  }

  // Determine Target Variant
  let targetVariant = null
  if (variant_id) {
    targetVariant = (product.variants || []).find((v: any) => v.id === variant_id)
    if (!targetVariant) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Variant ${variant_id} does not belong to product ${productId}`
      )
    }
  } else {
    if (!product.variants || product.variants.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Product ${productId} has no variants`
      )
    }
    targetVariant = product.variants[0]
  }

  const inventoryItemId =
    targetVariant.inventory_items?.[0]?.inventory_item_id ||
    targetVariant.inventory_items?.[0]?.inventory?.id

  if (!inventoryItemId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Variant ${targetVariant.id} does not have an associated inventory item`
    )
  }

  // Retrieve target inventory level or default location
  const invQuery = remoteQueryObjectFromString({
    entryPoint: "inventory_items",
    variables: { filters: { id: inventoryItemId } },
    fields: [
      "id",
      "location_levels.id",
      "location_levels.location_id",
      "location_levels.stocked_quantity",
      "location_levels.reserved_quantity",
      "location_levels.available_quantity",
    ],
  })

  const [invItem] = await remoteQuery(invQuery)

  let level = null
  if (location_id) {
    level = (invItem.location_levels || []).find(
      (l: any) => l.location_id === location_id
    )
  } else {
    level = invItem.location_levels?.[0]
  }

  let targetLocationId = location_id || level?.location_id

  if (!targetLocationId) {
    // Check if stock location exists
    const stockLocQuery = remoteQueryObjectFromString({
      entryPoint: "stock_locations",
      fields: ["id", "name"],
    })
    const stockLocs = await remoteQuery(stockLocQuery)
    if (!stockLocs || stockLocs.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No stock locations configured in system"
      )
    }
    targetLocationId = stockLocs[0].id
  }

  if (!level) {
    // Create level for location if missing
    level = await inventoryService.createInventoryLevels({
      inventory_item_id: inventoryItemId,
      location_id: targetLocationId,
      stocked_quantity: 0,
    })
  }

  const currentStocked = Number(level.stocked_quantity || 0)
  const changeValue = type === "increase" ? quantity : -quantity
  const resultingStock = currentStocked + changeValue

  if (resultingStock < 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Stock adjustment would result in negative inventory (${resultingStock}). Current stock: ${currentStocked}.`
    )
  }

  // Execute update and log transaction
  await inventoryService.updateInventoryLevels([
    {
      inventory_item_id: inventoryItemId,
      location_id: targetLocationId,
      stocked_quantity: resultingStock,
    },
  ])

  const actorId = req.auth_context?.actor_id || "admin"

  const transaction = await inventoryService.createInventoryTransaction({
    inventory_item_id: inventoryItemId,
    inventory_level_id: level.id,
    product_id: productId,
    variant_id: targetVariant.id,
    location_id: targetLocationId,
    quantity_before: currentStocked,
    quantity_change: changeValue,
    quantity_after: resultingStock,
    type,
    reason,
    note: note || null,
    reference_type: reference_type || "manual",
    reference_id: reference_id || null,
    created_by: actorId,
  })

  res.status(200).json({
    success: true,
    product_id: productId,
    variant_id: targetVariant.id,
    location_id: targetLocationId,
    quantity_before: currentStocked,
    quantity_change: changeValue,
    quantity_after: resultingStock,
    inventory_level_id: level.id,
    transaction,
  })
}
