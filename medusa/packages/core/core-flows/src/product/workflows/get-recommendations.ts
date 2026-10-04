import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  getRecommendationsStep,
  GetRecommendationsStepInput,
} from "../steps/get-recommendations"

export const getRecommendationsWorkflowId = "get-recommendations"

export const getRecommendationsWorkflow = createWorkflow(
  getRecommendationsWorkflowId,
  (input: WorkflowData<GetRecommendationsStepInput>) => {
    const result = getRecommendationsStep(input)
    return new WorkflowResponse(result)
  }
)
