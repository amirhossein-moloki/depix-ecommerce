import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ReorderProductVideosStepInput = {
  product_id: string
  video_ids: string[]
}

export const reorderProductVideosStepId = "reorder-product-videos-step"

export const reorderProductVideosStep = createStep(
  reorderProductVideosStepId,
  async (input: ReorderProductVideosStepInput, { container }) => {
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

    if (!Array.isArray(input.video_ids) || input.video_ids.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "video_ids must be a non-empty array of product video IDs"
      )
    }

    // 2. Fetch existing videos
    const [videos] = await productVideoService.listAndCountProductVideos({
      product_id: input.product_id,
    })

    const previousOrders = videos.map((v: any) => ({
      id: v.id,
      sort_order: v.sort_order,
    }))

    const videoMap = new Map<string, any>(videos.map((v: any) => [v.id, v]))

    const updatedVideos: any[] = []
    for (let index = 0; index < input.video_ids.length; index++) {
      const vid = input.video_ids[index]
      if (!videoMap.has(vid)) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product video ${vid} does not belong to product ${input.product_id}`
        )
      }

      const updated = await productVideoService.updateProductVideos({
        id: vid,
        sort_order: index,
      })
      updatedVideos.push(updated)
    }

    return new StepResponse(updatedVideos, { previousOrders })
  },
  async (compensateData, { container }) => {
    if (Array.isArray(compensateData?.previousOrders)) {
      const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)
      for (const item of compensateData.previousOrders) {
        await productVideoService.updateProductVideos({
          id: item.id,
          sort_order: item.sort_order,
        })
      }
    }
  }
)
