import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  getSimilarProductsStep,
  GetSimilarProductsStepInput,
} from "../steps/get-similar-products"

export const getSimilarProductsWorkflowId = "get-similar-products"

export const getSimilarProductsWorkflow = createWorkflow(
  getSimilarProductsWorkflowId,
  (input: WorkflowData<GetSimilarProductsStepInput>) => {
    const result = getSimilarProductsStep(input)
    return new WorkflowResponse(result)
  }
)
