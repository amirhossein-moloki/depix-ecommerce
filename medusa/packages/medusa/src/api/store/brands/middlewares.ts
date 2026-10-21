import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { StoreGetBrandsParams } from "./validators"

export const storeBrandRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/brands",
    middlewares: [validateAndTransformQuery(StoreGetBrandsParams)],
  },
  {
    method: ["GET"],
    matcher: "/store/brands/:id",
    middlewares: [],
  },
]
