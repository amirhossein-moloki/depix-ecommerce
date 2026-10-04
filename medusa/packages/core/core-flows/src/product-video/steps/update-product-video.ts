import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  detectProvider,
  extractVideoId,
  getThumbnailFallback,
  validateProvider,
  validateVideoUrl,
} from "@medusajs/product-video"

export type UpdateProductVideoStepInput = {
  id: string
  product_id?: string
  variant_id?: string | null
  provider?: string
  video_url?: string
  video_id?: string | null
  title?: string | null
  description?: string | null
  thumbnail_url?: string | null
  sort_order?: number
  status?: string
  metadata?: Record<string, unknown> | null
}

export const updateProductVideoStepId = "update-product-video-step"

export const updateProductVideoStep = createStep(
  updateProductVideoStepId,
  async (input: UpdateProductVideoStepInput, { container }) => {
    const productService = container.resolve<any>(Modules.PRODUCT)
    const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)

    // 1. Retrieve existing video
    let existingVideo: any
    try {
      existingVideo = await productVideoService.retrieveProductVideo(input.id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product video with id ${input.id} not found`
      )
    }

    const productId = input.product_id || existingVideo.product_id

    // 2. Verify product if changed
    if (input.product_id && input.product_id !== existingVideo.product_id) {
      try {
        await productService.retrieveProduct(input.product_id)
      } catch {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product with id ${input.product_id} not found`
        )
      }
    }

    // 3. Verify variant if provided
    if (input.variant_id !== undefined && input.variant_id !== null) {
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
      if (variantProductId && variantProductId !== productId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product variant ${input.variant_id} does not belong to product ${productId}`
        )
      }
    }

    const videoUrl = input.video_url || existingVideo.video_url
    if (input.video_url) {
      validateVideoUrl(input.video_url)
    }

    const provider = input.provider
      ? validateProvider(input.provider)
      : input.video_url
      ? detectProvider(input.video_url)
      : existingVideo.provider

    const videoId =
      input.video_id !== undefined
        ? input.video_id
        : extractVideoId(videoUrl, provider) || existingVideo.video_id

    const thumbnailUrl =
      input.thumbnail_url !== undefined
        ? getThumbnailFallback(provider, videoId, input.thumbnail_url)
        : existingVideo.thumbnail_url

    if (input.status) {
      const status = input.status.toLowerCase()
      if (status !== "active" && status !== "inactive") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid video status '${input.status}'. Allowed values are 'active' or 'inactive'.`
        )
      }
    }

    const updatePayload: Record<string, any> = {
      id: input.id,
      ...(input.product_id ? { product_id: input.product_id } : {}),
      ...(input.variant_id !== undefined ? { variant_id: input.variant_id } : {}),
      provider,
      video_url: videoUrl,
      video_id: videoId,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.thumbnail_url !== undefined ? { thumbnail_url: thumbnailUrl } : {}),
      ...(typeof input.sort_order === "number" ? { sort_order: input.sort_order } : {}),
      ...(input.status ? { status: input.status.toLowerCase() } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    }

    const updatedVideo = await productVideoService.updateProductVideos(updatePayload)

    return new StepResponse(updatedVideo, { previousVideo: existingVideo })
  },
  async (compensateData, { container }) => {
    if (compensateData?.previousVideo) {
      const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)
      await productVideoService.updateProductVideos(compensateData.previousVideo)
    }
  }
)
