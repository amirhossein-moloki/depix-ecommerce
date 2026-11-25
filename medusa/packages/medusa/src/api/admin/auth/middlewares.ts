import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export const AdminLoginBody = z
  .object({
    email: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1),
  })
  .refine((data) => Boolean(data.email || data.username), {
    message: "Either email or username is required",
  })

export const adminAuthRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/auth/login",
    middlewares: [validateAndTransformBody(AdminLoginBody)],
  },
  {
    method: ["POST"],
    matcher: "/admin/auth/logout",
    middlewares: [],
  },
]
