import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { generateEmbedUrl } from "@medusajs/product-video"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const variantId = req.query.variant_id as string | undefined

  const productService = req.scope.resolve<any>(Modules.PRODUCT)
  const productVideoService = req.scope.resolve<any>(Modules.PRODUCT_VIDEO)

  // Verify product exists
  try {
    await productService.retrieveProduct(productId)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const queryFilters: Record<string, any> = {
    product_id: productId,
    status: "active",
  }

  if (variantId) {
    queryFilters.variant_id = variantId
  }

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
