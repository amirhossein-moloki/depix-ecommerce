import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { AdminCreateReviewReply, AdminGetReviewsParams } from "./validators"

export const adminReviewRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/admin/reviews*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/reviews",
    middlewares: [
      validateAndTransformQuery(
        AdminGetReviewsParams,
        {
          defaults: ["id", "product_id", "customer_id", "rating", "title", "content", "status", "verified_purchase", "created_at"],
          isList: true,
        }
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/reviews/:id/reply",
    middlewares: [validateAndTransformBody(AdminCreateReviewReply)],
  },
]
