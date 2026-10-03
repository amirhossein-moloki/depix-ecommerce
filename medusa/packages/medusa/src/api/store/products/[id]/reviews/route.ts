import { createProductReviewWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { StoreCreateProductReviewType, StoreGetProductReviewsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetProductReviewsParamsType>,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const reviewService = req.scope.resolve<any>(Modules.REVIEW)

  const limit = req.queryConfig?.pagination?.take ?? 20
  const offset = req.queryConfig?.pagination?.skip ?? 0

  const [reviews, count] = await reviewService.listAndCountProductReviews(
    {
      product_id: productId,
      status: "APPROVED",
    },
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
      relations: ["reply"],
    }
  )

  const formattedReviews = reviews.map((r: any) => ({
    id: r.id,
    product_id: r.product_id,
    customer: {
      id: r.customer_id,
    },
    rating: r.rating,
    title: r.title,
    content: r.content,
    status: r.status,
    verified_purchase: r.verified_purchase,
    reply: r.reply
      ? {
          id: r.reply.id,
          content: r.reply.content,
          created_at: r.reply.created_at,
        }
      : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }))

  res.json({
    reviews: formattedReviews,
    count,
    offset,
    limit,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateProductReviewType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to submit a review"
    )
  }

  const productId = req.params.id
  const { rating, title, content } = req.validatedBody

  const { result: review } = await createProductReviewWorkflow(req.scope).run({
    input: {
      product_id: productId,
      customer_id: customerId,
      rating,
      title,
      content,
    },
  })

  res.status(201).json({ review })
}
