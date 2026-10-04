import { authenticate } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/framework/http"

export const adminPriceAlertRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/price-alerts*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
]
