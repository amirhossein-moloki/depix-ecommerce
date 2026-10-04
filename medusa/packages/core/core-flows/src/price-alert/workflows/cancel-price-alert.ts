import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { cancelPriceAlertStep, CancelPriceAlertStepInput } from "../steps/cancel-price-alert"

export const cancelPriceAlertWorkflowId = "cancel-price-alert"

export const cancelPriceAlertWorkflow = createWorkflow(
  cancelPriceAlertWorkflowId,
  (input: CancelPriceAlertStepInput) => {
    const priceAlert = cancelPriceAlertStep(input)
    return new WorkflowResponse(priceAlert)
  }
)
