import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import multer from "multer"
import { AdminGetMediaParams } from "./validators"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

export const adminMediaRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/media",
    middlewares: [validateAndTransformQuery(AdminGetMediaParams)],
  },
  {
    method: ["POST"],
    matcher: "/admin/media/upload",
    middlewares: [
      upload.fields([
        { name: "file", maxCount: 10 },
        { name: "files", maxCount: 10 },
      ]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/media/:id",
    middlewares: [],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/media/:id",
    middlewares: [],
  },
]
