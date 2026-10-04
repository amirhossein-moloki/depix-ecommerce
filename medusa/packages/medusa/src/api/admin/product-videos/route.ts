import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createProductVideoWorkflow } from "@medusajs/core-flows"
import { AdminCreateProductVideoType, AdminGetProductVideosParamsType } from "./validators"

export const GET = async (
  req: MedusaRequest<AdminGetProductVideosParamsType>,
  res: MedusaResponse
) => {
  const productVideoService = req.scope.resolve<any>(Modules.PRODUCT_VIDEO)

  const { limit = 50, offset = 0, product_id, variant_id, provider, status, q } = req.validatedQuery

  const filter: Record<string, any> = {}
  if (product_id) filter.product_id = product_id
  if (variant_id) filter.variant_id = variant_id
  if (provider) filter.provider = provider
  if (status) filter.status = status
  if (q) filter.title = { $ilike: `%${q}%` }

  const [videos, count] = await productVideoService.listAndCountProductVideos(
    filter,
    {
      skip: offset,
      take: limit,
      order: { sort_order: "ASC", created_at: "ASC" },
    }
  )

  res.json({
    product_videos: videos,
    count,
    limit,
    offset,
  })
}

export const POST = async (
  req: MedusaRequest<AdminCreateProductVideoType>,
  res: MedusaResponse
) => {
  const { result } = await createProductVideoWorkflow(req.scope).run({
    input: req.validatedBody,
    container: req.scope,
    throwOnError: true,
  })

  res.status(201).json({
    product_video: result,
  })
}
