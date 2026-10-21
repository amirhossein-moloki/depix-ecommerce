import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"

export const adminTicketRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET", "POST"],
    matcher: "/admin/ticket-categories",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/tickets",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/tickets/reports",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/tickets/:id",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/tickets/:id/messages",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/tickets/:id/status",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/tickets/:id/priority",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/tickets/:id/assign",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/tickets/:id/close",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/tickets/:id/reopen",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/ticket-attachments/:id/download",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
]
