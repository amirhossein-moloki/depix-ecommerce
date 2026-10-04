import { Modules } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const recService = req.scope.resolve(Modules.RECOMMENDATION)
  const activeModel = await recService.getActiveModel()

  res.json({
    active_model: activeModel,
    metrics: activeModel?.metrics || null,
    provider_status: {
      ml_enabled: process.env.ML_RECOMMENDATIONS_ENABLED !== "false",
      active_provider: process.env.ML_PROVIDER || "HYBRID",
      inference_timeout_ms: Number(process.env.ML_INFERENCE_TIMEOUT_MS) || 2000,
    },
  })
}
