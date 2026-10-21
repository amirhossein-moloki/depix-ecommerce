import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminCreateSizeGuideTemplate,
  AdminGetSizeGuideTemplatesParams,
  AdminUpdateSizeGuideTemplate,
  AdminUpsertProductSizeGuide,
} from "./validators"

export const adminSizeGuideRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/size-guides/templates",
    middlewares: [validateAndTransformQuery(AdminGetSizeGuideTemplatesParams)],
  },
  {
    method: ["POST"],
    matcher: "/admin/size-guides/templates",
    middlewares: [validateAndTransformBody(AdminCreateSizeGuideTemplate)],
  },
  {
    method: ["GET"],
    matcher: "/admin/size-guides/templates/:id",
    middlewares: [],
  },
  {
    method: ["PATCH"],
    matcher: "/admin/size-guides/templates/:id",
    middlewares: [validateAndTransformBody(AdminUpdateSizeGuideTemplate)],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/size-guides/templates/:id",
    middlewares: [],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/size-guide",
    middlewares: [],
  },
  {
    method: ["PUT"],
    matcher: "/admin/products/:id/size-guide",
    middlewares: [validateAndTransformBody(AdminUpsertProductSizeGuide)],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id/size-guide",
    middlewares: [],
  },
]
