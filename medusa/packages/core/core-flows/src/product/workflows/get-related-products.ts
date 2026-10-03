import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  getRelatedProductsStep,
  GetRelatedProductsStepInput,
} from "../steps/get-related-products"

export const getRelatedProductsWorkflowId = "get-related-products"

export const getRelatedProductsWorkflow = createWorkflow(
  getRelatedProductsWorkflowId,
  (input: WorkflowData<GetRelatedProductsStepInput>) => {
    const result = getRelatedProductsStep(input)
    return new WorkflowResponse(result)
  }
)
