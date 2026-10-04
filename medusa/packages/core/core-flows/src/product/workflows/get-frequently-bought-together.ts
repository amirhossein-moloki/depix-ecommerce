import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  getFrequentlyBoughtTogetherStep,
  GetFrequentlyBoughtTogetherStepInput,
} from "../steps/get-frequently-bought-together"

export const getFrequentlyBoughtTogetherWorkflowId =
  "get-frequently-bought-together"

export const getFrequentlyBoughtTogetherWorkflow = createWorkflow(
  getFrequentlyBoughtTogetherWorkflowId,
  (input: WorkflowData<GetFrequentlyBoughtTogetherStepInput>) => {
    const result = getFrequentlyBoughtTogetherStep(input)
    return new WorkflowResponse(result)
  }
)
