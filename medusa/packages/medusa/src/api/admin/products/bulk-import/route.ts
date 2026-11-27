import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { bulkImportProducts } from "./service"
import { AdminBulkImportProductsType } from "./validators"

/**
 * @oas [post] /admin/products/bulk-import
 * operationId: "bulkImportAdminProducts"
 * summary: "Bulk Import Products"
 * description: "Imports products in bulk from JSON with category/brand find-or-create, Inventory Module stock provisioning, price unit normalization, upsert/skip/create_only modes, and dry-run validation."
 * x-authenticated: true
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBulkImportProductsType>,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id || "admin"
  const result = await bulkImportProducts(req.scope, req.validatedBody, actorId)
  res.status(200).json(result)
}
