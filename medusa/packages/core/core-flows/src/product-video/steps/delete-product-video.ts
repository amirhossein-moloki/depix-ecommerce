import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type DeleteProductVideoStepInput = {
  id: string
}

export const deleteProductVideoStepId = "delete-product-video-step"

export const deleteProductVideoStep = createStep(
  deleteProductVideoStepId,
  async (input: DeleteProductVideoStepInput, { container }) => {
    const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)

    let existingVideo: any
    try {
      existingVideo = await productVideoService.retrieveProductVideo(input.id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product video with id ${input.id} not found`
      )
    }

    await productVideoService.deleteProductVideos([input.id])

    return new StepResponse(
      { id: input.id, deleted: true, product_id: existingVideo.product_id },
      { previousVideo: existingVideo }
    )
  },
  async (compensateData, { container }) => {
    if (compensateData?.previousVideo) {
      const productVideoService = container.resolve<any>(Modules.PRODUCT_VIDEO)
      await productVideoService.createProductVideos(compensateData.previousVideo)
    }
  }
)
