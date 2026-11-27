import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  adjustVariantInventory,
  AdjustVariantInventoryInput,
} from "../utils/adjust-variant-inventory"

/**
 * @oas [post] /admin/inventory/adjust
 * operationId: "AdminAdjustInventory"
 * summary: "Adjust Variant Inventory"
 * description: "Sets or adjusts real inventory stock for a product variant in the Inventory Module and records an InventoryTransaction."
 * x-authenticated: true
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdjustVariantInventoryInput>,
  res: MedusaResponse
) => {
  const body = (req.body || {}) as AdjustVariantInventoryInput
  const result = await adjustVariantInventory(req.scope, {
    ...body,
    actor_id: req.auth_context?.actor_id || "admin",
    recordTransactionIfUnchanged: true,
  })

  res.status(200).json(result)
}
