import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminCreateFreeShippingRule,
  AdminGetFreeShippingRulesParams,
  AdminUpdateFreeShippingRule,
} from "./validators"

export const adminFreeShippingRuleRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/free-shipping-rules",
    middlewares: [
      validateAndTransformQuery(AdminGetFreeShippingRulesParams, {}),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/free-shipping-rules",
    middlewares: [validateAndTransformBody(AdminCreateFreeShippingRule)],
  },
  {
    method: ["GET"],
    matcher: "/admin/free-shipping-rules/:id",
    middlewares: [],
  },
  {
    method: ["PATCH", "POST"],
    matcher: "/admin/free-shipping-rules/:id",
    middlewares: [validateAndTransformBody(AdminUpdateFreeShippingRule)],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/free-shipping-rules/:id",
    middlewares: [],
  },
]
