import { getBestSellingProductsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { enrichStoreDiscoveryProducts } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0
  const period = req.query.period as string | undefined

  const { result } = await getBestSellingProductsWorkflow(req.scope).run({
    input: {
      limit,
      offset,
      period,
    },
  })

  const products = await enrichStoreDiscoveryProducts(
    req,
    result.products ?? []
  )

  res.json({
    products,
    count: result.count,
    offset: result.offset,
    limit: result.limit,
  })
}
