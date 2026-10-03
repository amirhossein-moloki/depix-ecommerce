import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  getBestSellingProductsStep,
  GetBestSellingProductsStepInput,
} from "../steps/get-bestselling-products"

export const getBestSellingProductsWorkflowId = "get-bestselling-products"

export const getBestSellingProductsWorkflow = createWorkflow(
  getBestSellingProductsWorkflowId,
  (input: WorkflowData<GetBestSellingProductsStepInput>) => {
    const result = getBestSellingProductsStep(input)
    return new WorkflowResponse(result)
  }
)
