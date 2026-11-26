import { getOrdersListWorkflow } from "@medusajs/core-flows"
import { HttpTypes, OrderDTO } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { applyOrderStatusMetadata } from "../../utils/order-status"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminOrderFilters>,
  res: MedusaResponse<HttpTypes.AdminOrderListResponse>
) => {
  const pagination = {
    ...req.queryConfig.pagination,
    order: req.queryConfig.pagination?.order ?? { created_at: "DESC" },
  }

  const variables = {
    filters: {
      ...req.filterableFields,
      is_draft_order: false,
    },
    ...pagination,
  }

  const workflow = getOrdersListWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      variables,
    },
  })

  const { rows, metadata } = result as {
    rows: OrderDTO[]
    metadata: any
  }
  res.json({
    orders: rows.map((o) =>
      applyOrderStatusMetadata(o)
    ) as unknown as HttpTypes.AdminOrder[],
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
