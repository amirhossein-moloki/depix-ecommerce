import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  formatReturnRequest,
  restoreSellableReturnInventory,
} from "../../../../store/returns/helpers"
import { AdminInspectReturnType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminInspectReturnType>,
  res: MedusaResponse
) => {
  const orderService = req.scope.resolve<any>(Modules.ORDER)
  const { id } = req.params

  const ret = await orderService
    .retrieveReturn(id, { relations: ["items", "items.item", "order"] })
    .catch(() => null)

  if (!ret) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request '${id}' not found.`
    )
  }

  const { result, note } = req.validatedBody
  let restoredInventoryCount = 0

  if (result === "sellable" && !ret.metadata?.inspection?.inventory_restored) {
    restoredInventoryCount = await restoreSellableReturnInventory(req.scope, ret)
  }

  const updated = await orderService.updateReturns({
    id: ret.id,
    metadata: {
      ...(ret.metadata ?? {}),
      rma_status: "inspected",
      inspection: {
        result,
        note: note ?? null,
        inspected_at: new Date().toISOString(),
        inspected_by: req.auth_context?.actor_id ?? null,
        inventory_restored:
          result === "sellable" ||
          Boolean(ret.metadata?.inspection?.inventory_restored),
        restored_items_count: restoredInventoryCount,
      },
    },
  })

  return res.json({ return_request: formatReturnRequest(updated) })
}
