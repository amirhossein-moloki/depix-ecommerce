import { getRecommendationsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productId = req.query.product_id as string | undefined
  const cartId = req.query.cart_id as string | undefined
  const type = req.query.type as any
  const contextType = req.query.context as any
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0
  const period = (req.query.period as string) || "7d"
  const customerId = req.auth_context?.actor_id

  const { result } = await getRecommendationsWorkflow(req.scope).run({
    input: {
      product_id: productId,
      customer_id: customerId,
      cart_id: cartId,
      type,
      context_type: contextType,
      limit,
      offset,
      period,
    },
    container: req.scope,
  })

  res.json({
    recommendations: result.products,
    count: result.count,
    offset: result.offset,
    limit: result.limit,
    strategy_used: result.strategy_used,
    fallback_applied: result.fallback_applied,
  })
}
