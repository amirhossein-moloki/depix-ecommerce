import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { createPriceAlertStep, CreatePriceAlertStepInput } from "../steps/create-price-alert"

export const createPriceAlertWorkflowId = "create-price-alert"

export const createPriceAlertWorkflow = createWorkflow(
  createPriceAlertWorkflowId,
  (input: CreatePriceAlertStepInput) => {
    const priceAlert = createPriceAlertStep(input)
    return new WorkflowResponse(priceAlert)
  }
)
