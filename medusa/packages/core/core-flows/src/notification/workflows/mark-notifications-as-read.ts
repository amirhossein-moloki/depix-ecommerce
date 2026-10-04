import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  MarkNotificationsAsReadStepInput,
  markNotificationsAsReadStep,
} from "../steps"

export const markNotificationsAsReadWorkflowId = "mark-notifications-as-read"

export const markNotificationsAsReadWorkflow = createWorkflow(
  markNotificationsAsReadWorkflowId,
  (input: MarkNotificationsAsReadStepInput) => {
    return new WorkflowResponse(markNotificationsAsReadStep(input))
  }
)
