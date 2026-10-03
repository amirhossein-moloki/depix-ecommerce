import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const reviewService = req.scope.resolve<any>(Modules.REVIEW)

  const approvedReviews = await reviewService.listProductReviews({
    product_id: productId,
    status: "APPROVED",
  })

  const count = approvedReviews.length
  const distribution: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  }

  let totalRating = 0

  if (count > 0) {
    for (const r of approvedReviews) {
      const ratingStr = String(r.rating)
      if (distribution[ratingStr] !== undefined) {
        distribution[ratingStr] += 1
      }
      totalRating += r.rating
    }
  }

  const averageRating = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 0

  res.json({
    average_rating: averageRating,
    review_count: count,
    rating_distribution: distribution,
  })
}
