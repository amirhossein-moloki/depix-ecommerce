import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../../utils/validators"

export const AdminGetSalesReportParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
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
        "payment_method",
        "currency",
      ])
      .optional(),
    order_status: z.string().optional(),
    product_id: z.string().optional(),
    variant_id: z.string().optional(),
    category_id: z.string().optional(),
    customer_id: z.string().optional(),
    currency: z.string().optional(),
    payment_method: z.string().optional(),
  })
)

export type AdminGetSalesReportParamsType = z.infer<typeof AdminGetSalesReportParams>
