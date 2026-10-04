import { getRecommendationsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

  const { result } = await getRecommendationsWorkflow(req.scope).run({
    input: {
      type: "POPULAR",
      limit,
      offset,
    },
    container: req.scope,
  })

  res.json({
    products: result.products,
    count: result.count,
    offset: result.offset,
    limit: result.limit,
    strategy_used: result.strategy_used,
    fallback_applied: result.fallback_applied,
  })
}
