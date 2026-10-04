import { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "../../../utils/middlewares/authenticate-middleware"

export const adminInvoiceRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET", "POST"],
    matcher: "/admin/invoices*",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/orders/:id/invoice",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
  },
]
