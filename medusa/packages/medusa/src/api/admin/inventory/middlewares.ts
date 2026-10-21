import { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "../../utils/middlewares"

export const adminCustomInventoryRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/products/:id/inventory",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/inventory/adjustments",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/inventory/history",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/inventory/low-stock",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/inventory/history",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
]
