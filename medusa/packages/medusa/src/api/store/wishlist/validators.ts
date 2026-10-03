import { z } from "@medusajs/framework/zod"

export const StoreCreateWishlistItem = z
  .object({
    product_id: z.string().min(1),
    variant_id: z.string().optional().nullable(),
  })
  .strict()

export type StoreCreateWishlistItemType = z.infer<typeof StoreCreateWishlistItem>
