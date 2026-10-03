import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { replyToProductReviewStep } from "../steps/reply-to-product-review"

export type ReplyToProductReviewWorkflowInput = {
  review_id: string
  admin_id: string
  content: string
}

export const replyToProductReviewWorkflowId = "reply-to-product-review"

export const replyToProductReviewWorkflow = createWorkflow(
  replyToProductReviewWorkflowId,
  (input: WorkflowData<ReplyToProductReviewWorkflowInput>) => {
    const createdReply = replyToProductReviewStep(input)

    const eventData = transform({ createdReply }, ({ createdReply }) => ({
      id: createdReply.id,
      review_id: createdReply.review_id,
      admin_id: createdReply.admin_id,
    }))

    emitEventStep({
      eventName: "review.replied",
      data: eventData,
    })

    return new WorkflowResponse(createdReply)
  }
)
