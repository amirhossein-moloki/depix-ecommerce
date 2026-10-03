import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../../../utils/validators"

export const StoreCreateProductReview = z
  .object({
    rating: z.number().int().min(1).max(5),
    title: z.string().optional().nullable(),
    content: z.string().min(1),
  })
  .strict()

export type StoreCreateProductReviewType = z.infer<typeof StoreCreateProductReview>

export const StoreGetProductReviewsParams = createFindParams({
  offset: 0,
  limit: 20,
})

export type StoreGetProductReviewsParamsType = z.infer<
  typeof StoreGetProductReviewsParams
>
