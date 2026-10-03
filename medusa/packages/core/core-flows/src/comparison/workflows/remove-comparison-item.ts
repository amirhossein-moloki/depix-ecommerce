import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { removeComparisonItemStep } from "../steps/remove-comparison-item"

export type RemoveComparisonItemWorkflowInput = {
  customer_id?: string | null
  comparison_id?: string | null
  comparison_item_id: string
}

export const removeComparisonItemWorkflowId = "remove-comparison-item"

export const removeComparisonItemWorkflow = createWorkflow(
  removeComparisonItemWorkflowId,
  (input: WorkflowData<RemoveComparisonItemWorkflowInput>) => {
    const result = removeComparisonItemStep(input)

    const eventData = transform({ input }, ({ input }) => ({
      comparison_item_id: input.comparison_item_id,
    }))

    emitEventStep({
      eventName: "comparison.item_removed",
      data: eventData,
    })

    return new WorkflowResponse(result)
  }
)
