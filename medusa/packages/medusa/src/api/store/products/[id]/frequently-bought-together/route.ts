import { getFrequentlyBoughtTogetherWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

  const { result } = await getFrequentlyBoughtTogetherWorkflow(req.scope).run({
    input: {
      product_id: productId,
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
