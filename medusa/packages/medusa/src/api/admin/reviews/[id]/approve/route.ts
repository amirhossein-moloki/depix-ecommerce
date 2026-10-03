import { approveProductReviewWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const id = req.params.id

  const { result: review } = await approveProductReviewWorkflow(req.scope).run({
    input: { id },
  })

  res.status(200).json({ review })
}
