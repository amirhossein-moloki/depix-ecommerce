import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const AdminGetReviewsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    product_id: z.string().optional(),
    customer_id: z.string().optional(),
    rating: z.coerce.number().optional(),
    verified_purchase: z
      .union([z.boolean(), z.string().transform((v) => v === "true")])
      .optional(),
  })
)

export type AdminGetReviewsParamsType = z.infer<typeof AdminGetReviewsParams>

export const AdminCreateReviewReply = z
  .object({
    content: z.string().min(1),
  })
  .strict()

export type AdminCreateReviewReplyType = z.infer<typeof AdminCreateReviewReply>
