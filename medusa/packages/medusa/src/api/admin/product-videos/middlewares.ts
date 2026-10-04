import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import {
  AdminCreateProductVideo,
  AdminGetProductVideoParams,
  AdminGetProductVideosParams,
  AdminReorderProductVideos,
  AdminUpdateProductVideo,
} from "./validators"

export const adminProductVideoRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/admin/product-videos*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: "ALL",
    matcher: "/admin/products/:id/videos*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-videos",
    middlewares: [
      validateAndTransformQuery(AdminGetProductVideosParams, {
        defaults: [
          "id",
          "product_id",
          "variant_id",
          "provider",
          "video_url",
          "video_id",
          "title",
          "description",
          "thumbnail_url",
          "sort_order",
          "status",
          "created_at",
          "updated_at",
        ],
        isList: true,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-videos",
    middlewares: [validateAndTransformBody(AdminCreateProductVideo)],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-videos/:id",
    middlewares: [
      validateAndTransformQuery(AdminGetProductVideoParams, {
        defaults: [
          "id",
          "product_id",
          "variant_id",
          "provider",
          "video_url",
          "video_id",
          "title",
          "description",
          "thumbnail_url",
          "sort_order",
          "status",
          "created_at",
          "updated_at",
        ],
        isList: false,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-videos/:id",
    middlewares: [validateAndTransformBody(AdminUpdateProductVideo)],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-videos/reorder",
    middlewares: [validateAndTransformBody(AdminReorderProductVideos)],
  },
]
