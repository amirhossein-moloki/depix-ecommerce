import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { formatReturnRequest } from "../../../../store/returns/helpers"
import { AdminApproveReturnType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminApproveReturnType>,
  res: MedusaResponse
) => {
  const orderService = req.scope.resolve<any>(Modules.ORDER)
  const { id } = req.params

  const ret = await orderService
    .retrieveReturn(id, { relations: ["items", "order"] })
    .catch(() => null)

  if (!ret) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request '${id}' not found.`
    )
  }

  const updated = await orderService.updateReturns({
    id: ret.id,
    metadata: {
      ...(ret.metadata ?? {}),
      rma_status: "approved",
      admin_note: req.validatedBody?.admin_note ?? ret.metadata?.admin_note ?? null,
      approved_at: new Date().toISOString(),
      approved_by: req.auth_context?.actor_id ?? null,
    },
  })

  return res.json({ return_request: formatReturnRequest(updated) })
}
