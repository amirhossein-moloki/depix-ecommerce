import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  getTrendingProductsStep,
  GetTrendingProductsStepInput,
} from "../steps/get-trending-products"

export const getTrendingProductsWorkflowId = "get-trending-products"

export const getTrendingProductsWorkflow = createWorkflow(
  getTrendingProductsWorkflowId,
  (input: WorkflowData<GetTrendingProductsStepInput>) => {
    const result = getTrendingProductsStep(input)
    return new WorkflowResponse(result)
  }
)
