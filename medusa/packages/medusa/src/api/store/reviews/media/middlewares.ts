import { MiddlewareRoute } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

export const storeReviewMediaRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/reviews/media",
    middlewares: [
      upload.fields([
        { name: "file", maxCount: 5 },
        { name: "files", maxCount: 5 },
      ]),
    ],
  },
]
