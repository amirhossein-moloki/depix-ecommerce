import { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "../../../utils/middlewares/authenticate-middleware"

export const adminSettingsRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/settings*",
    middlewares: [authenticate("user", ["bearer", "session"])],
  },
]
