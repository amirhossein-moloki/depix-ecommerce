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
 * @oas [get] /admin/products/{id}/inventory/history
 * operationId: "AdminGetProductInventoryHistory"
 * summary: "Get Product Inventory History"
 * description: "Retrieves paginated audit log of inventory changes for a specific product."
 * x-authenticated: true
 * parameters:
 *   - (path) id* {string} The ID of the product.
 *   - (query) variant_id {string} Filter transactions by variant ID.
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
 *             history:
 *               type: array
 *               items:
 *                 type: object
 *             count:
 *               type: integer
 *             offset:
 *               type: integer
 *             limit:
 *               type: integer
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
  const queryParams = req.query || {}

  const variantId = queryParams.variant_id as string
  const limit = Math.max(1, Math.min(100, parseInt((queryParams.limit as string) || "20", 10)))
  const offset = Math.max(0, parseInt((queryParams.offset as string) || "0", 10))

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  // Verify product exists
  const productQuery = remoteQueryObjectFromString({
    entryPoint: "product",
    variables: { id: productId },
    fields: ["id"],
  })

  const [product] = await remoteQuery(productQuery)
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} not found`
    )
  }

  const filters: Record<string, any> = {
    product_id: productId,
  }

  if (variantId) {
    filters.variant_id = variantId
  }

  const historyQuery = remoteQueryObjectFromString({
    entryPoint: "inventory_transactions",
    variables: {
      filters,
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    },
    fields: [
      "id",
      "inventory_item_id",
      "inventory_level_id",
      "product_id",
      "variant_id",
      "location_id",
      "quantity_before",
      "quantity_change",
      "quantity_after",
      "type",
      "reason",
      "note",
      "reference_type",
      "reference_id",
      "created_by",
      "created_at",
    ],
  })

  const { rows: history, metadata } = await remoteQuery(historyQuery)

  res.status(200).json({
    history: history || [],
    count: metadata?.count || (history || []).length,
    offset,
    limit,
  })
}
