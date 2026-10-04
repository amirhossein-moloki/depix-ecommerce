import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  deleteProductVideoWorkflow,
  updateProductVideoWorkflow,
} from "@medusajs/core-flows"
import { AdminUpdateProductVideoType } from "../validators"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const productVideoService = req.scope.resolve<any>(Modules.PRODUCT_VIDEO)

  let video: any
  try {
    video = await productVideoService.retrieveProductVideo(id)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product video with id ${id} not found`
    )
  }

  res.json({
    product_video: video,
  })
}

export const POST = async (
  req: MedusaRequest<AdminUpdateProductVideoType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateProductVideoWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
    container: req.scope,
    throwOnError: true,
  })

  res.json({
    product_video: result,
  })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteProductVideoWorkflow(req.scope).run({
    input: { id },
    container: req.scope,
    throwOnError: true,
  })

  res.json({
    id,
    object: "product_video",
    deleted: true,
  })
}
