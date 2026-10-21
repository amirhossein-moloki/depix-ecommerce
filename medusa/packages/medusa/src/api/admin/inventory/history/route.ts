import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

/**
 * @oas [get] /admin/inventory/history
 * operationId: "AdminGetGlobalInventoryHistory"
 * summary: "Get Global Inventory Audit Trail"
 * description: "Retrieves a paginated inventory transaction audit log with optional filtering by product, variant, location, transaction type, reason, user, or date range."
 * x-authenticated: true
 * parameters:
 *   - (query) product_id {string} Filter by product ID.
 *   - (query) variant_id {string} Filter by variant ID.
 *   - (query) location_id {string} Filter by location ID.
 *   - (query) type {string} Filter by transaction type (increase|decrease).
 *   - (query) reason {string} Filter by reason.
 *   - (query) reference_id {string} Filter by reference ID (e.g. order_id).
 *   - (query) created_by {string} Filter by actor ID.
 *   - (query) from {string} Filter by start timestamp.
 *   - (query) to {string} Filter by end timestamp.
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
 *   401:
 *     description: Unauthorized
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const queryParams = req.query || {}

  const productId = queryParams.product_id as string
  const variantId = queryParams.variant_id as string
  const locationId = queryParams.location_id as string
  const type = queryParams.type as string
  const reason = queryParams.reason as string
  const referenceId = queryParams.reference_id as string
  const createdBy = queryParams.created_by as string
  const from = queryParams.from as string
  const to = queryParams.to as string

  const limit = Math.max(1, Math.min(100, parseInt((queryParams.limit as string) || "20", 10)))
  const offset = Math.max(0, parseInt((queryParams.offset as string) || "0", 10))

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const filters: Record<string, any> = {}

  if (productId) filters.product_id = productId
  if (variantId) filters.variant_id = variantId
  if (locationId) filters.location_id = locationId
  if (type) filters.type = type
  if (reason) filters.reason = reason
  if (referenceId) filters.reference_id = referenceId
  if (createdBy) filters.created_by = createdBy

  if (from || to) {
    filters.created_at = {}
    if (from) filters.created_at["$gte"] = new Date(from)
    if (to) filters.created_at["$lte"] = new Date(to)
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
