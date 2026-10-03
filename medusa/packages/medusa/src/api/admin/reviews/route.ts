import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminGetReviewsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetReviewsParamsType>,
  res: MedusaResponse
) => {
  const reviewService = req.scope.resolve<any>(Modules.REVIEW)

  const limit = req.queryConfig?.pagination?.take ?? 20
  const offset = req.queryConfig?.pagination?.skip ?? 0

  const filters: Record<string, any> = {}

  if (req.validatedQuery?.status) {
    filters.status = req.validatedQuery.status
  }
  if (req.validatedQuery?.product_id) {
    filters.product_id = req.validatedQuery.product_id
  }
  if (req.validatedQuery?.customer_id) {
    filters.customer_id = req.validatedQuery.customer_id
  }
  if (req.validatedQuery?.rating !== undefined) {
    filters.rating = req.validatedQuery.rating
  }
  if (req.validatedQuery?.verified_purchase !== undefined) {
    filters.verified_purchase = req.validatedQuery.verified_purchase
  }

  const [reviews, count] = await reviewService.listAndCountProductReviews(
    filters,
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
      relations: ["reply"],
    }
  )

  res.json({
    reviews,
    count,
    offset,
    limit,
  })
}
