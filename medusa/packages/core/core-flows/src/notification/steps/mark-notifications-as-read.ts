import { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type MarkNotificationsAsReadStepInput = {
  id: string | string[]
  receiver_id?: string
}

export const markNotificationsAsReadStepId = "mark-notifications-as-read"

export const markNotificationsAsReadStep = createStep(
  markNotificationsAsReadStepId,
  async (input: MarkNotificationsAsReadStepInput, { container }) => {
    const service = container.resolve<INotificationModuleService>(
      Modules.NOTIFICATION
    )

    const ids = Array.isArray(input.id) ? input.id : [input.id]
    const notifications = await service.listNotifications({
      id: ids,
      ...(input.receiver_id ? { receiver_id: input.receiver_id } : {}),
    })

    if (!notifications.length) {
      return new StepResponse([], [])
    }

    const unreadIds = notifications
      .filter((n) => !n.read_at)
      .map((n) => n.id)

    const updated = await service.markAsRead(
      notifications.map((n) => n.id)
    )

    return new StepResponse(updated, unreadIds)
  }
)
