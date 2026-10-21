import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { StoreGetCategoriesParams } from "./validators"

export const storeCategoryRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/categories",
    middlewares: [validateAndTransformQuery(StoreGetCategoriesParams)],
  },
  {
    method: ["GET"],
    matcher: "/store/categories/:id",
    middlewares: [],
  },
]
