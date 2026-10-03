import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { processStockAvailabilityStep } from "../steps/process-stock-availability"

export type ProcessStockAvailabilityWorkflowInput = {
  variant_id: string
  inventory_item_id?: string
}

export const processStockAvailabilityWorkflowId = "process-stock-availability"

export const processStockAvailabilityWorkflow = createWorkflow(
  processStockAvailabilityWorkflowId,
  (input: WorkflowData<ProcessStockAvailabilityWorkflowInput>) => {
    const result = processStockAvailabilityStep(input)
    return new WorkflowResponse(result)
  }
)
