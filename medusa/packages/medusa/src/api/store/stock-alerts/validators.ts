import { z } from "@medusajs/framework/zod"

export const StoreCreateStockAlert = z
  .object({
    product_id: z.string().min(1),
    variant_id: z.string().min(1),
    channel: z.string().optional(),
  })
  .strict()

export type StoreCreateStockAlertType = z.infer<typeof StoreCreateStockAlert>

export const StoreGetStockAlertsParams = z.object({
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0),
  status: z.string().optional(),
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
})

export type StoreGetStockAlertsParamsType = z.infer<
  typeof StoreGetStockAlertsParams
>
