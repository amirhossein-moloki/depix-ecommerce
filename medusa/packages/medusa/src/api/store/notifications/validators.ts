import { z } from "@medusajs/framework/zod"

export const StoreGetNotificationsParams = z.object({
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0),
  is_read: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "boolean") return val
      if (val === "true" || val === "1") return true
      if (val === "false" || val === "0") return false
      return undefined
    })
    .optional(),
  unread_only: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "boolean") return val
      return val === "true" || val === "1"
    })
    .optional(),
  trigger_type: z.string().optional(),
  type: z.string().optional(),
  channel: z.string().optional(),
})

export type StoreGetNotificationsParamsType = z.infer<
  typeof StoreGetNotificationsParams
>
