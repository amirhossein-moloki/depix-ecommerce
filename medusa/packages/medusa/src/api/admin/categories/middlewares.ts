import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminCreateCategory,
  AdminGetCategoriesParams,
  AdminUpdateCategory,
} from "./validators"

export const adminCategoryRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/categories",
    middlewares: [validateAndTransformQuery(AdminGetCategoriesParams)],
  },
  {
    method: ["POST"],
    matcher: "/admin/categories",
    middlewares: [validateAndTransformBody(AdminCreateCategory)],
  },
  {
    method: ["GET"],
    matcher: "/admin/categories/:id",
    middlewares: [],
  },
  {
    method: ["PUT"],
    matcher: "/admin/categories/:id",
    middlewares: [validateAndTransformBody(AdminUpdateCategory)],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/categories/:id",
    middlewares: [],
  },
]
