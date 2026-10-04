import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reorderProductVideosWorkflow } from "@medusajs/core-flows"
import { AdminReorderProductVideosType } from "../validators"

export const POST = async (
  req: MedusaRequest<AdminReorderProductVideosType>,
  res: MedusaResponse
) => {
  const { result } = await reorderProductVideosWorkflow(req.scope).run({
    input: req.validatedBody,
    container: req.scope,
    throwOnError: true,
  })

  res.json({
    product_videos: result,
  })
}
