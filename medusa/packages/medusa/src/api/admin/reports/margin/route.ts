import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminGetMarginReportParamsType } from "./validators"
import { MarginReportingService } from "./margin-reporting.service"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMarginReportParamsType>,
  res: MedusaResponse
) => {
  const reportingService = new MarginReportingService(req.scope)

  const queryParams = req.validatedQuery || {}
  const options = {
    from: queryParams.from,
    to: queryParams.to,
    group_by: queryParams.group_by,
    order_status: queryParams.order_status,
    product_id: queryParams.product_id,
    variant_id: queryParams.variant_id,
    category_id: queryParams.category_id,
    customer_id: queryParams.customer_id,
    currency: queryParams.currency,
    limit: queryParams.limit,
    offset: queryParams.offset,
  }

  const result = await reportingService.getMarginReport(options)

  res.status(200).json(result)
}
