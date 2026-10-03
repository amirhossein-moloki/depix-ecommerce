import { z } from "@medusajs/framework/zod"

export const AdminGetStockAlertsParams = z.object({
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0),
  customer_id: z.string().optional(),
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
})

export type AdminGetStockAlertsParamsType = z.infer<
  typeof AdminGetStockAlertsParams
>
