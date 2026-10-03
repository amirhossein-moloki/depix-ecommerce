import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type ReplyToProductReviewStepInput = {
  review_id: string
  admin_id: string
  content: string
}

export const replyToProductReviewStepId = "reply-to-product-review-step"

export const replyToProductReviewStep = createStep(
  replyToProductReviewStepId,
  async (input: ReplyToProductReviewStepInput, { container }) => {
    const { review_id, admin_id, content } = input

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reply content cannot be empty"
      )
    }

    const reviewService = container.resolve<any>(Modules.REVIEW)

    const review = await reviewService.retrieveProductReview(review_id).catch(() => null)
    if (!review) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Review with id: ${review_id} was not found`
      )
    }

    // Check if reply already exists
    const existingReplies = await reviewService.listReviewReplies({ review_id })

    let reply: any
    let isCreated = false

    if (existingReplies && existingReplies.length > 0) {
      const [updated] = await reviewService.updateReviewReplies([
        {
          id: existingReplies[0].id,
          admin_id,
          content: content.trim(),
        },
      ])
      reply = updated
    } else {
      const [created] = await reviewService.createReviewReplies([
        {
          review_id,
          admin_id,
          content: content.trim(),
        },
      ])
      reply = created
      isCreated = true
    }

    return new StepResponse(reply, { replyId: reply.id, isCreated })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }
    const reviewService = container.resolve<any>(Modules.REVIEW)
    if (compensationData.isCreated) {
      await reviewService.deleteReviewReplies([compensationData.replyId])
    }
  }
)
