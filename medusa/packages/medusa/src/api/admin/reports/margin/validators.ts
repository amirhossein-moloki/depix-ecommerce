import { z } from "zod"

export const AdminGetMarginReportParams = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  group_by: z
    .enum([
      "day",
      "week",
      "month",
      "product",
      "variant",
      "category",
      "currency",
    ])
    .optional(),
  order_status: z.string().optional(),
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
  category_id: z.string().optional(),
  customer_id: z.string().optional(),
  currency: z.string().optional(),
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
})

export type AdminGetMarginReportParamsType = z.infer<
  typeof AdminGetMarginReportParams
>
