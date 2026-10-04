import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  MarkAllNotificationsAsReadStepInput,
  markAllNotificationsAsReadStep,
} from "../steps"

export const markAllNotificationsAsReadWorkflowId =
  "mark-all-notifications-as-read"

export const markAllNotificationsAsReadWorkflow = createWorkflow(
  markAllNotificationsAsReadWorkflowId,
  (input: MarkAllNotificationsAsReadStepInput) => {
    return new WorkflowResponse(markAllNotificationsAsReadStep(input))
  }
)
