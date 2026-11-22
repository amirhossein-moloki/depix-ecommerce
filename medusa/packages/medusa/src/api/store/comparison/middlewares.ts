import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { StoreAddComparisonItem } from "./validators"

export const storeComparisonRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/comparison",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/comparison/items",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformBody(StoreAddComparisonItem),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/comparison/items",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/comparison/items/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
    ],
  },
]
