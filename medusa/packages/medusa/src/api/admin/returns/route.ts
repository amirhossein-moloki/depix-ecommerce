import { beginReturnOrderWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  promiseAll,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { formatReturnRequest } from "../../store/returns/helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminReturnFilters>,
  res: MedusaResponse<HttpTypes.AdminReturnsResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const filters: Record<string, any> = { ...(req.filterableFields ?? {}) }
  const statusFilter = filters.status as string | string[] | undefined
  const reasonFilter = filters.reason as string | undefined
  const qFilter = filters.q as string | undefined
  delete filters.status
  delete filters.reason
  delete filters.q

  const hasCustomFilter =
    statusFilter !== undefined ||
    reasonFilter !== undefined ||
    qFilter !== undefined

  if (!hasCustomFilter) {
    const queryObject = remoteQueryObjectFromString({
      entryPoint: "returns",
      variables: {
        filters,
        ...req.queryConfig.pagination,
      },
      fields: req.queryConfig.fields,
    })

    const { rows: returns, metadata } = await remoteQuery(queryObject)

    return res.json({
      returns: (returns ?? []).map(formatReturnRequest),
      count: metadata.count,
      offset: metadata.skip,
      limit: metadata.take,
    })
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "returns",
    variables: {
      filters,
      order: req.queryConfig.pagination?.order,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: allReturns = [] } = await remoteQuery(queryObject)
  const allowedStatuses = statusFilter
    ? Array.isArray(statusFilter)
      ? statusFilter
      : [statusFilter]
    : null

  const filtered = allReturns.map(formatReturnRequest).filter((ret: any) => {
    if (allowedStatuses && !allowedStatuses.includes(ret.status)) {
      return false
    }
    if (reasonFilter && ret.reason !== reasonFilter) {
      return false
    }
    if (qFilter) {
      const needle = qFilter.toLowerCase()
      const haystack = [
        ret.id,
        ret.order_id,
        ret.reason,
        ret.description,
        ret.shipment?.tracking_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(needle)) {
        return false
      }
    }
    return true
  })

  const skip = req.queryConfig.pagination?.skip ?? 0
  const take = req.queryConfig.pagination?.take ?? 15
  const paged = filtered.slice(skip, skip + take)

  return res.json({
    returns: paged,
    count: filtered.length,
    offset: skip,
    limit: take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminInitiateReturnRequest,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.AdminOrderReturnResponse>
) => {
  const input = {
    ...req.validatedBody,
    created_by: req.auth_context.actor_id,
  }

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const workflow = beginReturnOrderWorkflow(req.scope)
  const { result } = await workflow.run({
    input,
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

  res.json({
    order,
    return: orderReturn[0],
  })
}
