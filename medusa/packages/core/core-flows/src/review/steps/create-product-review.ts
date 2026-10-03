import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type CreateProductReviewStepInput = {
  product_id: string
  customer_id: string
  rating: number
  title?: string | null
  content: string
}

export const createProductReviewStepId = "create-product-review-step"

export const createProductReviewStep = createStep(
  createProductReviewStepId,
  async (input: CreateProductReviewStepInput, { container }) => {
    const { product_id, customer_id, rating, title, content } = input

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Rating must be an integer or number between 1 and 5"
      )
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Review content cannot be empty"
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Verify Product exists
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { id: product_id },
    })

    if (!products || products.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id: ${product_id} was not found`
      )
    }

    const reviewService = container.resolve<any>(Modules.REVIEW)

    // Check duplicate review
    const existingReviews = await reviewService.listProductReviews({
      product_id,
      customer_id,
    })

    if (existingReviews && existingReviews.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Customer ${customer_id} has already submitted a review for product ${product_id}`
      )
    }

    // Determine verified_purchase by inspecting customer's order history
    let verified_purchase = false
    try {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "customer_id", "items.product_id"],
        filters: { customer_id },
      })

      if (orders && orders.length > 0) {
        verified_purchase = orders.some((order: any) =>
          order.items?.some((item: any) => item.product_id === product_id)
        )
      }
    } catch {
      verified_purchase = false
    }

    const [review] = await reviewService.createProductReviews([
      {
        product_id,
        customer_id,
        rating,
        title: title ? title.trim() : null,
        content: content.trim(),
        status: "PENDING",
        verified_purchase,
      },
    ])

    return new StepResponse(review, review.id)
  },
  async (reviewId, { container }) => {
    if (!reviewId) {
      return
    }
    const reviewService = container.resolve<any>(Modules.REVIEW)
    await reviewService.deleteProductReviews([reviewId])
  }
)
