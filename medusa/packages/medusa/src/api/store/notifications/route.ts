import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StoreGetNotificationsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetNotificationsParamsType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to access notifications"
    )
  }

  const notificationService = req.scope.resolve<any>(Modules.NOTIFICATION)
  const {
    limit = 20,
    offset = 0,
    is_read,
    unread_only,
    trigger_type,
    type,
    channel,
  } = req.validatedQuery || {}

  const filters: Record<string, any> = {
    receiver_id: customerId,
  }

  if (channel) {
    filters.channel = channel
  }

  const effectiveTriggerType = trigger_type || type
  if (effectiveTriggerType) {
    filters.trigger_type = effectiveTriggerType
  }

  if (unread_only || is_read === false) {
    filters.read_at = null
  } else if (is_read === true) {
    filters.read_at = { $ne: null }
  }

  const [notifications, count] =
    await notificationService.listAndCountNotifications(filters, {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    })

  const unreadCount = await notificationService.getUnreadCount(customerId)

  res.json({
    notifications,
    count,
    limit,
    offset,
    unread_count: unreadCount,
  })
}
