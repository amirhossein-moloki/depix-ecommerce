import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminGetSalesReportParamsType } from "./validators"
import { SalesReportingService } from "./sales-reporting.service"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetSalesReportParamsType>,
  res: MedusaResponse
) => {
  const reportingService = new SalesReportingService(req.scope)

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
    payment_method: queryParams.payment_method,
    limit: queryParams.limit,
    offset: queryParams.offset,
  }

  const result = await reportingService.getSalesReport(options)

  res.status(200).json(result)
}
