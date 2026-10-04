import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to access notification"
    )
  }

  const { id } = req.params
  const notificationService = req.scope.resolve<any>(Modules.NOTIFICATION)

  const notifications = await notificationService.listNotifications({
    id,
    receiver_id: customerId,
  })

  const notification = notifications[0]
  if (!notification) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Notification with id: ${id} was not found`
    )
  }

  res.json({ notification })
}
