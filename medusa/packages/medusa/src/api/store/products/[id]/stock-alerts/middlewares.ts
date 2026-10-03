import { validateAndTransformBody } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { StoreCreateProductStockAlert } from "./validators"

export const storeProductStockAlertRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/products/:id/stock-alerts",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreateProductStockAlert),
    ],
  },
]
