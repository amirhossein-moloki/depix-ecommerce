import {
  addComparisonItemWorkflow,
  clearComparisonWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { StoreAddComparisonItemType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreAddComparisonItemType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id || null
  const { product_id } = req.validatedBody

  const { result } = await addComparisonItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
    },
  })

  res.status(201).json({
    item: result.item,
    comparison: result.comparison,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id || null

  await clearComparisonWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
    },
  })

  res.json({
    success: true,
    object: "comparison",
    deleted: true,
  })
}
