import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"

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
  {
    method: ["POST"],
    matcher: "/admin/inventory/adjust",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
]
