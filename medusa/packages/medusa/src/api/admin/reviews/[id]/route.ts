import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const reviewService = req.scope.resolve<any>(Modules.REVIEW)
  const id = req.params.id

  const review = await reviewService.retrieveProductReview(id, {
    relations: ["reply"],
  }).catch(() => null)

  if (!review) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Review with id: ${id} was not found`
    )
  }

  res.json({ review })
}
