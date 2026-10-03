import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { clearWishlistStep } from "../steps/clear-wishlist"

export type ClearWishlistWorkflowInput = {
  customer_id: string
}

export const clearWishlistWorkflowId = "clear-wishlist"

export const clearWishlistWorkflow = createWorkflow(
  clearWishlistWorkflowId,
  (input: WorkflowData<ClearWishlistWorkflowInput>) => {
    const result = clearWishlistStep(input)
    return new WorkflowResponse(result)
  }
)
