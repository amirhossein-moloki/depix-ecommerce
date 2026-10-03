import { z } from "@medusajs/framework/zod"

export const StoreCreateProductStockAlert = z
  .object({
    variant_id: z.string().min(1),
    channel: z.string().optional(),
  })
  .strict()

export type StoreCreateProductStockAlertType = z.infer<
  typeof StoreCreateProductStockAlert
>
