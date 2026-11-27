import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"

export const adminCustomInventoryRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/products/:id/inventory",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/inventory/adjustments",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/inventory/history",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/inventory/low-stock",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/inventory/history",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory/adjust",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
]
