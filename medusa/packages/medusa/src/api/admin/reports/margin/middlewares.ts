import { validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { AdminGetMarginReportParams } from "./validators"

export const adminMarginReportRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/admin/reports*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/reports/margin",
    middlewares: [
      validateAndTransformQuery(
        AdminGetMarginReportParams,
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
            "limit",
            "offset",
          ],
          isList: true,
        }
      ),
    ],
  },
]
