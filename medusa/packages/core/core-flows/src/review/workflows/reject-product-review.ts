import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { rejectProductReviewStep } from "../steps/reject-product-review"

export type RejectProductReviewWorkflowInput = {
  id: string
}

export const rejectProductReviewWorkflowId = "reject-product-review"

export const rejectProductReviewWorkflow = createWorkflow(
  rejectProductReviewWorkflowId,
  (input: WorkflowData<RejectProductReviewWorkflowInput>) => {
    const rejectedReview = rejectProductReviewStep(input)

    const eventData = transform({ rejectedReview }, ({ rejectedReview }) => ({
      id: rejectedReview.id,
      product_id: rejectedReview.product_id,
      customer_id: rejectedReview.customer_id,
      status: rejectedReview.status,
    }))

    emitEventStep({
      eventName: "review.rejected",
      data: eventData,
    })

    return new WorkflowResponse(rejectedReview)
  }
)
