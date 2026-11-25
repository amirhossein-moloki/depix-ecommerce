import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export const StoreInitiatePaymentBody = z.object({
  cart_id: z.string().min(1),
  provider: z.string().default("zarinpal"),
  callback_url: z.string().url(),
})

export const StoreCartPaymentSessionBody = z.object({
  provider: z.string().default("zarinpal"),
  callback_url: z.string().url(),
})

export const StoreVerifyPaymentBody = z.object({
  cart_id: z.string().min(1),
  authority: z.string().optional(),
  ref_id: z.string().optional(),
  status: z.string().optional(),
})

export const storePaymentRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/payments/initiate",
    middlewares: [validateAndTransformBody(StoreInitiatePaymentBody)],
  },
  {
    method: ["POST"],
    matcher: "/store/payments/verify",
    middlewares: [validateAndTransformBody(StoreVerifyPaymentBody)],
  },
  {
    method: ["POST"],
    matcher: "/store/carts/:id/payment-sessions",
    middlewares: [validateAndTransformBody(StoreCartPaymentSessionBody)],
  },
]
