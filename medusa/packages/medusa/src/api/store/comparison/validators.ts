import { z } from "@medusajs/framework/zod"

export const StoreAddComparisonItem = z
  .object({
    product_id: z.string().min(1),
  })
  .strict()

export type StoreAddComparisonItemType = z.infer<typeof StoreAddComparisonItem>
