import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { clearComparisonStep } from "../steps/clear-comparison"

export type ClearComparisonWorkflowInput = {
  customer_id?: string | null
  comparison_id?: string | null
}

export const clearComparisonWorkflowId = "clear-comparison"

export const clearComparisonWorkflow = createWorkflow(
  clearComparisonWorkflowId,
  (input: WorkflowData<ClearComparisonWorkflowInput>) => {
    const result = clearComparisonStep(input)
    return new WorkflowResponse(result)
  }
)
