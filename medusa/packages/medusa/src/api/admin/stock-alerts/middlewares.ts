import { validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { AdminGetStockAlertsParams } from "./validators"

export const adminStockAlertRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/admin/stock-alerts*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/stock-alerts",
    middlewares: [
      validateAndTransformQuery(AdminGetStockAlertsParams, {
        defaults: [
          "id",
          "customer_id",
          "product_id",
          "variant_id",
          "channel",
          "status",
          "created_at",
          "notified_at",
        ],
        isList: true,
      }),
    ],
  },
]
