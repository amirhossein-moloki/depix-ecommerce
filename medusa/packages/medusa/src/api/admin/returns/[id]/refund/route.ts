import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { formatReturnRequest } from "../../../../store/returns/helpers"
import { AdminRefundReturnType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRefundReturnType>,
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

  const { amount_irr, reference_id, note } = req.validatedBody
  const updated = await orderService.updateReturns({
    id: ret.id,
    refund_amount: amount_irr,
    metadata: {
      ...(ret.metadata ?? {}),
      rma_status: "refunded",
      refund: {
        amount_irr,
        reference_id,
        note: note ?? null,
        refunded_at: new Date().toISOString(),
        refunded_by: req.auth_context?.actor_id ?? null,
      },
    },
  })

  return res.json({ return_request: formatReturnRequest(updated) })
}
