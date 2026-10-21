import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"

export const storeTicketRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/ticket-categories",
    middlewares: [],
  },
  {
    method: ["GET", "POST"],
    matcher: "/store/tickets",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/tickets/:id",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET", "POST"],
    matcher: "/store/tickets/:id/messages",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/orders/:id/ticket-products",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/ticket-attachments/:id/download",
    middlewares: [authenticate(["customer", "user"], ["session", "bearer"])],
  },
]
