import { validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { StoreGetNotificationsParams } from "./validators"

export const storeNotificationRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/notifications",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(StoreGetNotificationsParams, {
        defaults: [
          "id",
          "to",
          "channel",
          "template",
          "data",
          "trigger_type",
          "resource_id",
          "resource_type",
          "receiver_id",
          "status",
          "read_at",
          "created_at",
        ],
        isList: true,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/notifications/read-all",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/notifications/unread-count",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/notifications/:id",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/notifications/:id/read",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
]
