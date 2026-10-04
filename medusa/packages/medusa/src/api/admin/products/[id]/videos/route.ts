import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createProductVideoWorkflow } from "@medusajs/core-flows"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const productVideoService = req.scope.resolve<any>(Modules.PRODUCT_VIDEO)

  const [videos, count] = await productVideoService.listAndCountProductVideos(
    { product_id: productId },
    {
      order: { sort_order: "ASC", created_at: "ASC" },
    }
  )

  res.json({
    product_videos: videos,
    count,
  })
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.params.id

  const payload = {
    ...req.body,
    product_id: productId,
  }

  const { result } = await createProductVideoWorkflow(req.scope).run({
    input: payload as any,
    container: req.scope,
    throwOnError: true,
  })

  res.status(201).json({
    product_video: result,
  })
}
