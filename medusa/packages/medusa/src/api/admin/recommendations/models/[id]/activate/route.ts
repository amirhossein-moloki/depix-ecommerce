import { Modules } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const modelId = req.params.id
  const recService = req.scope.resolve(Modules.RECOMMENDATION)

  try {
    const activatedModel = await recService.activateModel(modelId)
    res.json({
      model: activatedModel,
      message: `Model ${modelId} activated successfully`,
    })
  } catch (err: any) {
    res.status(400).json({
      message: "Model activation failed",
      error: err?.message || String(err),
    })
  }
}
