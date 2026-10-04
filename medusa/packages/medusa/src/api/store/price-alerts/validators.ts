import { z } from "zod"

export type StoreCreatePriceAlertType = z.infer<typeof StoreCreatePriceAlert>
export const StoreCreatePriceAlert = z
  .object({
    product_id: z.string(),
    variant_id: z.string(),
    currency_code: z.string(),
    region_id: z.string().optional().nullable(),
    alert_type: z.enum(["any_change", "price_drop", "target_price"]).optional().default("price_drop"),
    reference_price: z.number().optional(),
    target_price: z.number().optional().nullable(),
    channel: z.enum(["in-app", "email", "sms"]).optional().default("in-app"),
    metadata: z.record(z.unknown()).optional().nullable(),
  })
  .strict()

export type StoreGetPriceAlertsParamsType = z.infer<
  typeof StoreGetPriceAlertsParams
>
export const StoreGetPriceAlertsParams = z.object({
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0),
  status: z.string().optional(),
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
  currency_code: z.string().optional(),
})
