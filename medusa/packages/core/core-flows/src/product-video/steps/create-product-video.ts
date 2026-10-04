import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  detectProvider,
  extractVideoId,
  getThumbnailFallback,
  validateProvider,
  validateVideoUrl,
} from "@medusajs/product-video"

export type CreateProductVideoStepInput = {
  product_id: string
  variant_id?: string | null
  provider?: string
  video_url: string
  video_id?: string | null
  title?: string | null
  description?: string | null
  thumbnail_url?: string | null
  sort_order?: number
  status?: string
  metadata?: Record<string, unknown> | null
}

export const createProductVideoStepId = "create-product-video-step"

export const createProductVideoStep = createStep(
  createProductVideoStepId,
  async (input: CreateProductVideoStepInput, { container }) => {
    const productService = container.resolve<any>(Modules.PRODUCT)
    const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)

    // 1. Verify product exists
    try {
      await productService.retrieveProduct(input.product_id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${input.product_id} not found`
      )
    }

    // 2. Verify variant if variant_id provided
    if (input.variant_id) {
      let variant: any
      try {
        variant = await productService.retrieveProductVariant(input.variant_id)
      } catch {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product variant with id ${input.variant_id} not found`
        )
      }

      const variantProductId = variant.product_id ?? variant.product?.id
      if (variantProductId && variantProductId !== input.product_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product variant ${input.variant_id} does not belong to product ${input.product_id}`
        )
      }
    }

    // 3. Validate video URL and provider
    validateVideoUrl(input.video_url)
    const provider = input.provider
      ? validateProvider(input.provider)
      : detectProvider(input.video_url)

    // 4. Extract video_id if not supplied
    const videoId = input.video_id || extractVideoId(input.video_url, provider)

    // 5. Compute thumbnail
    const thumbnailUrl = getThumbnailFallback(provider, videoId, input.thumbnail_url)

    // 6. Validate status
    const status = (input.status || "active").toLowerCase()
    if (status !== "active" && status !== "inactive") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid video status '${input.status}'. Allowed values are 'active' or 'inactive'.`
      )
    }

    // 7. Create product video
    const newVideo = await productVideoService.createProductVideos({
      product_id: input.product_id,
      variant_id: input.variant_id ?? null,
      provider,
      video_url: input.video_url.trim(),
      video_id: videoId,
      title: input.title ? input.title.trim() : null,
      description: input.description ? input.description.trim() : null,
      thumbnail_url: thumbnailUrl,
      sort_order: typeof input.sort_order === "number" ? input.sort_order : 0,
      status,
      metadata: input.metadata ?? null,
    })

    return new StepResponse(newVideo, { createdId: newVideo.id })
  },
  async (compensateData, { container }) => {
    if (compensateData?.createdId) {
      const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)
      await productVideoService.deleteProductVideos([compensateData.createdId])
    }
  }
)
