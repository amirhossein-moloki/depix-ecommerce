import {
  getOrderDetailWorkflow,
  updateOrderWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminOrder, HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyOrderStatusMetadata } from "../../../utils/order-status"

export const GET = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminGetOrderDetailsParams
  >,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id,
      version: req.validatedQuery.version as number,
    },
  })

  res
    .status(200)
    .json({ order: applyOrderStatusMetadata(result) as HttpTypes.AdminOrder })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdateOrder,
    HttpTypes.AdminGetOrderDetailsParams
  >,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  await updateOrderWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      user_id: req.auth_context.actor_id,
      id: req.params.id,
    },
  })

  let order: any
  try {
    const workflow = getOrderDetailWorkflow(req.scope)
    const { result } = await workflow.run({
      input: {
        fields: req.queryConfig.fields,
        order_id: req.params.id,
      },
    })
    order = result
  } catch {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const result = await query.graph({
      entity: "order",
      filters: { id: req.params.id },
      fields: req.queryConfig.fields,
    })
    order = result.data[0]
  }

  res
    .status(200)
    .json({ order: applyOrderStatusMetadata(order) as AdminOrder })
}
