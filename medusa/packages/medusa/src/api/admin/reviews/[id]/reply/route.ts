import { replyToProductReviewWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminCreateReviewReplyType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateReviewReplyType>,
  res: MedusaResponse
) => {
  const reviewId = req.params.id
  const adminId = req.auth_context?.actor_id ?? "admin"
  const { content } = req.validatedBody

  const { result: reply } = await replyToProductReviewWorkflow(req.scope).run({
    input: {
      review_id: reviewId,
      admin_id: adminId,
      content,
    },
  })

  res.status(200).json({ reply })
}
