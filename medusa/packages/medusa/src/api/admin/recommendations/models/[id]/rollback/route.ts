import { Modules } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const recService = req.scope.resolve(Modules.RECOMMENDATION)

  try {
    const rolledBackModel = await recService.rollbackModel()
    if (!rolledBackModel) {
      return res.status(404).json({
        message: "No archived model found to rollback to",
      })
    }
    res.json({
      model: rolledBackModel,
      message: "Rolled back to previous model version successfully",
    })
  } catch (err: any) {
    res.status(400).json({
      message: "Model rollback failed",
      error: err?.message || String(err),
    })
  }
}
