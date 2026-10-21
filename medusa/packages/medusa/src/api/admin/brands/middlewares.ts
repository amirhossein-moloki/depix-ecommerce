import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminCreateBrand,
  AdminGetBrandsParams,
  AdminUpdateBrand,
} from "./validators"

export const adminBrandRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/brands",
    middlewares: [validateAndTransformQuery(AdminGetBrandsParams)],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands",
    middlewares: [validateAndTransformBody(AdminCreateBrand)],
  },
  {
    method: ["GET"],
    matcher: "/admin/brands/:id",
    middlewares: [],
  },
  {
    method: ["PUT"],
    matcher: "/admin/brands/:id",
    middlewares: [validateAndTransformBody(AdminUpdateBrand)],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/brands/:id",
    middlewares: [],
  },
]
