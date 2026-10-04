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
      "Authentication required to get unread notification count"
    )
  }

  const notificationService = req.scope.resolve<any>(Modules.NOTIFICATION)
  const count = await notificationService.getUnreadCount(customerId)

  res.status(200).json({ count })
}
