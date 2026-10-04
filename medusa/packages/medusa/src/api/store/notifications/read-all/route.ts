import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { markAllNotificationsAsReadWorkflow } from "@medusajs/core-flows"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to mark all notifications as read"
    )
  }

  const { result } = await markAllNotificationsAsReadWorkflow(req.scope).run({
    input: {
      receiver_id: customerId,
    },
  })

  res.status(200).json({
    success: true,
    count: result?.count ?? 0,
  })
}
