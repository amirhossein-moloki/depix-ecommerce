import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type ApproveProductReviewStepInput = {
  id: string
}

export const approveProductReviewStepId = "approve-product-review-step"

export const approveProductReviewStep = createStep(
  approveProductReviewStepId,
  async (input: ApproveProductReviewStepInput, { container }) => {
    const reviewService = container.resolve<any>(Modules.REVIEW)

    const existing = await reviewService.retrieveProductReview(input.id).catch(() => null)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Review with id: ${input.id} was not found`
      )
    }

    const previousStatus = existing.status

    const [updated] = await reviewService.updateProductReviews([
      {
        id: input.id,
        status: "APPROVED",
      },
    ])

    return new StepResponse(updated, { id: input.id, previousStatus })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }
    const reviewService = container.resolve<any>(Modules.REVIEW)
    await reviewService.updateProductReviews([
      {
        id: compensationData.id,
        status: compensationData.previousStatus,
      },
    ])
  }
)
