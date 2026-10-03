import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { addComparisonItemStep } from "../steps/add-comparison-item"

export type AddComparisonItemWorkflowInput = {
  customer_id?: string | null
  comparison_id?: string | null
  product_id: string
}

export const addComparisonItemWorkflowId = "add-comparison-item"

export const addComparisonItemWorkflow = createWorkflow(
  addComparisonItemWorkflowId,
  (input: WorkflowData<AddComparisonItemWorkflowInput>) => {
    const result = addComparisonItemStep(input)

    const eventData = transform({ result }, ({ result }) => ({
      id: result.item.id,
      comparison_id: result.comparison.id,
      product_id: result.item.product_id,
    }))

    emitEventStep({
      eventName: "comparison.item_added",
      data: eventData,
    })

    return new WorkflowResponse(result)
  }
)
