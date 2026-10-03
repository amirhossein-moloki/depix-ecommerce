import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { createProductReviewStep } from "../steps/create-product-review"

export type CreateProductReviewWorkflowInput = {
  product_id: string
  customer_id: string
  rating: number
  title?: string | null
  content: string
}

export const createProductReviewWorkflowId = "create-product-review"

export const createProductReviewWorkflow = createWorkflow(
  createProductReviewWorkflowId,
  (input: WorkflowData<CreateProductReviewWorkflowInput>) => {
    const createdReview = createProductReviewStep(input)

    const eventData = transform({ createdReview }, ({ createdReview }) => ({
      id: createdReview.id,
      product_id: createdReview.product_id,
      customer_id: createdReview.customer_id,
      status: createdReview.status,
    }))

    emitEventStep({
      eventName: "review.created",
      data: eventData,
    })

    return new WorkflowResponse(createdReview)
  }
)
