import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import {
  StoreCreateStockAlert,
  StoreGetStockAlertsParams,
} from "./validators"

export const storeStockAlertRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/stock-alerts",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(StoreGetStockAlertsParams, {
        defaults: ["id", "customer_id", "product_id", "variant_id", "channel", "status", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/stock-alerts",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreateStockAlert),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/stock-alerts/:id",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
]
