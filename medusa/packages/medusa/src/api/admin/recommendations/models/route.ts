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
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

  const [models, count] = await recService.listAndCountRecommendationModels(
    {},
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    }
  )

  const activeModel = await recService.getActiveModel()

  res.json({
    models,
    count,
    limit,
    offset,
    active_model: activeModel,
  })
}
