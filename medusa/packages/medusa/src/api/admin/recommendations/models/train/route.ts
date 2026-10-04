import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { OfflineTrainingPipeline } from "@medusajs/recommendation"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const pipeline = new OfflineTrainingPipeline({
    lookbackDays: req.body?.lookback_days,
    validationSplitRatio: req.body?.validation_ratio,
  })

  try {
    const trainedModel = await pipeline.runTrainingPipeline(req.scope)
    res.json({
      model: trainedModel,
      message: "ML recommendation model trained successfully",
    })
  } catch (err: any) {
    res.status(500).json({
      message: "Model training failed",
      error: err?.message || String(err),
    })
  }
}
