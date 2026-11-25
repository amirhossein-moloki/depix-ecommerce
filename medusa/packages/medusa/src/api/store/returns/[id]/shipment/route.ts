import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { formatReturnRequest } from "../../helpers"
import { StoreReturnShipmentSchemaType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreReturnShipmentSchemaType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({
      type: "unauthorized",
      message: "Customer authentication required.",
    })
  }

  const orderService = req.scope.resolve<any>(Modules.ORDER)
  const ret = await orderService
    .retrieveReturn(req.params.id, { relations: ["items", "order"] })
    .catch(() => null)

  if (!ret) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request '${req.params.id}' not found.`
    )
  }

  const formatted = formatReturnRequest(ret)
  if (formatted.customer_id && formatted.customer_id !== customerId) {
    return res.status(403).json({
      type: "forbidden",
      message: "You do not have permission to update this return request.",
    })
  }

  if (!["requested", "approved"].includes(formatted.status)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot submit shipment tracking in status '${formatted.status}'.`
    )
  }

  const { method, tracking_code } = req.validatedBody
  const updated = await orderService.updateReturns({
    id: ret.id,
    metadata: {
      ...(ret.metadata ?? {}),
      rma_status: "shipped",
      shipment: {
        method,
        tracking_code,
        shipped_at: new Date().toISOString(),
      },
    },
  })

  return res.json({ return_request: formatReturnRequest(updated) })
}
