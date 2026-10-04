import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  StoreCreatePriceAlert,
  StoreGetPriceAlertsParams,
} from "./validators"

export const storePriceAlertRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/price-alerts",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreatePriceAlert),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/price-alerts",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(StoreGetPriceAlertsParams, {
        defaults: { limit: 20, offset: 0 },
        isQuery: true,
      }),
    ],
  },
  {
    method: ["GET", "DELETE"],
    matcher: "/store/price-alerts/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
]
