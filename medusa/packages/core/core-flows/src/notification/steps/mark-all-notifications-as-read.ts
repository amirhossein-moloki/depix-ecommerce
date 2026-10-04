import { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type MarkAllNotificationsAsReadStepInput = {
  receiver_id: string
}

export const markAllNotificationsAsReadStepId =
  "mark-all-notifications-as-read"

export const markAllNotificationsAsReadStep = createStep(
  markAllNotificationsAsReadStepId,
  async (input: MarkAllNotificationsAsReadStepInput, { container }) => {
    const service = container.resolve<INotificationModuleService>(
      Modules.NOTIFICATION
    )

    const result = await service.markAllAsRead(input.receiver_id)

    return new StepResponse(result, input.receiver_id)
  }
)
