import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { StoreCreateProductReview, StoreGetProductReviewsParams } from "./validators"

export const storeProductReviewRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/products/:id/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreCreateProductReview),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformQuery(
        StoreGetProductReviewsParams,
        {
          defaults: ["id", "rating", "title", "content", "status", "verified_purchase", "created_at"],
          isList: true,
        }
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id/reviews/summary",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
    ],
  },
]
