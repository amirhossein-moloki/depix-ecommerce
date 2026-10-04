import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { markNotificationsAsReadWorkflow } from "@medusajs/core-flows"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to mark notification as read"
    )
  }

  const { id } = req.params

  const { result } = await markNotificationsAsReadWorkflow(req.scope).run({
    input: {
      id,
      receiver_id: customerId,
    },
  })

  const notification = Array.isArray(result) ? result[0] : result
  if (!notification) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Notification with id: ${id} was not found`
    )
  }

  res.json({ notification })
}
