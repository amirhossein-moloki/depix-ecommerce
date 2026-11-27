import { validateAndTransformBody } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import {
  AdminCreateBanner,
  AdminReorderBanners,
  AdminUpdateBanner,
} from "./validators"

export const adminBannerRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/banners",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["POST"],
    matcher: "/admin/banners",
    middlewares: [
      authenticate("user", ["bearer", "session", "api-key"]),
      validateAndTransformBody(AdminCreateBanner),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/banners/reorder",
    middlewares: [
      authenticate("user", ["bearer", "session", "api-key"]),
      validateAndTransformBody(AdminReorderBanners),
    ],
  },
  {
    method: ["GET", "DELETE"],
    matcher: "/admin/banners/:id",
    middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
  },
  {
    method: ["PATCH", "POST"],
    matcher: "/admin/banners/:id",
    middlewares: [
      authenticate("user", ["bearer", "session", "api-key"]),
      validateAndTransformBody(AdminUpdateBanner),
    ],
  },
]
