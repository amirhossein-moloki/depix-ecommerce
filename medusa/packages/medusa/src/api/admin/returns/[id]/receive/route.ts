import {
  beginReceiveReturnWorkflow,
  cancelReturnReceiveWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  promiseAll,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { formatReturnRequest } from "../../../../store/returns/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminInitiateReceiveReturn & { received_at?: string | Date },
    HttpTypes.SelectParams
  >,
  res: MedusaResponse
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const orderModuleService = req.scope.resolve<any>(Modules.ORDER)

  const { id } = req.params
  const body = (req.validatedBody ?? req.body ?? {}) as any

  const existing = await orderModuleService
    .retrieveReturn(id, { relations: ["items", "order"] })
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request '${id}' not found.`
    )
  }

  // RMA flow: if created via /store/returns (has metadata.rma_status) or received_at is provided
  if (existing.metadata?.rma_status || body.received_at !== undefined) {
    const receivedAt = body.received_at
      ? new Date(body.received_at)
      : new Date()
    const updated = await orderModuleService.updateReturns({
      id: existing.id,
      received_at: receivedAt,
      metadata: {
        ...(existing.metadata ?? {}),
        rma_status: "received",
        received_by: req.auth_context?.actor_id ?? null,
      },
    })

    const formatted = formatReturnRequest(updated)
    return res.json({
      return_request: formatted,
      return: formatted,
    })
  }

  const workflow = beginReceiveReturnWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      ...req.validatedBody,
      return_id: id,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "return",
    variables: {
      id: result.return_id,
      filters: {
        ...req.filterableFields,
      },
    },
    fields: req.queryConfig.fields,
  })

  const [order, orderReturn] = await promiseAll([
    orderModuleService.retrieveOrder(result.order_id),
    remoteQuery(queryObject),
  ])

  return res.json({
    order,
    return: orderReturn[0],
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminReturnDeleteResponse>
) => {
  const { id } = req.params

  await cancelReturnReceiveWorkflow(req.scope).run({
    input: {
      return_id: id,
    },
  })

  res.status(200).json({
    id,
    object: "return",
    deleted: true,
  })
}
