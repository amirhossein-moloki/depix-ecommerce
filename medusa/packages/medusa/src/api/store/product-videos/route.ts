import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { generateEmbedUrl } from "@medusajs/product-video"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.query.product_id as string | undefined
  const variantId = req.query.variant_id as string | undefined

  if (!productId && !variantId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Either product_id or variant_id query parameter is required"
    )
  }

  const productVideoService = req.scope.resolve<any>(Modules.PRODUCT_VIDEO)

  const queryFilters: Record<string, any> = {
    status: "active",
  }

  if (productId) queryFilters.product_id = productId
  if (variantId) queryFilters.variant_id = variantId

  const [videos, count] = await productVideoService.listAndCountProductVideos(
    queryFilters,
    {
      order: { sort_order: "ASC", created_at: "ASC" },
    }
  )

  const publicVideos = videos.map((v: any) => ({
    id: v.id,
    product_id: v.product_id,
    variant_id: v.variant_id,
    provider: v.provider,
    video_url: v.video_url,
    video_id: v.video_id,
    title: v.title,
    description: v.description,
    thumbnail_url: v.thumbnail_url,
    sort_order: v.sort_order,
    embed_url: generateEmbedUrl(v.provider, v.video_id, v.video_url),
  }))

  res.json({
    product_videos: publicVideos,
    count,
  })
}
