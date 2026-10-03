import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { approveProductReviewStep } from "../steps/approve-product-review"

export type ApproveProductReviewWorkflowInput = {
  id: string
}

export const approveProductReviewWorkflowId = "approve-product-review"

export const approveProductReviewWorkflow = createWorkflow(
  approveProductReviewWorkflowId,
  (input: WorkflowData<ApproveProductReviewWorkflowInput>) => {
    const approvedReview = approveProductReviewStep(input)

    const eventData = transform({ approvedReview }, ({ approvedReview }) => ({
      id: approvedReview.id,
      product_id: approvedReview.product_id,
      customer_id: approvedReview.customer_id,
      status: approvedReview.status,
    }))

    emitEventStep({
      eventName: "review.approved",
      data: eventData,
    })

    return new WorkflowResponse(approvedReview)
  }
)
