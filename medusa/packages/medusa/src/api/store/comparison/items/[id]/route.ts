import { removeComparisonItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id || null
  const comparisonItemId = req.params.id

  await removeComparisonItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      comparison_item_id: comparisonItemId,
    },
  })

  res.json({
    id: comparisonItemId,
    object: "comparison_item",
    deleted: true,
  })
}
