import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { processPriceChangeStep, ProcessPriceChangeStepInput } from "../steps/process-price-change"

export const processPriceChangeWorkflowId = "process-price-change"

export const processPriceChangeWorkflow = createWorkflow(
  processPriceChangeWorkflowId,
  (input: ProcessPriceChangeStepInput) => {
    const result = processPriceChangeStep(input)
    return new WorkflowResponse(result)
  }
)
