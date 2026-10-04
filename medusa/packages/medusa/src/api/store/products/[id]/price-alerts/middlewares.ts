import {
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { StoreCreatePriceAlert } from "../../../price-alerts/validators"

export const storeProductPriceAlertRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/products/:id/price-alerts",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreatePriceAlert),
    ],
  },
]
