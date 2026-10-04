import { validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { AdminGetSalesReportParams } from "./validators"

export const adminSalesReportRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/admin/reports*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/reports/sales",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSalesReportParams,
        {
          defaults: [
            "from",
            "to",
            "group_by",
            "order_status",
            "product_id",
            "variant_id",
            "category_id",
            "customer_id",
            "currency",
            "payment_method",
            "limit",
            "offset",
          ],
          isList: true,
        }
      ),
    ],
  },
]
