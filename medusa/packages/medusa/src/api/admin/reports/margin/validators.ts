import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../../utils/validators"

const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val

const optionalString = z.preprocess(emptyToUndefined, z.string().optional())

export const AdminGetMarginReportParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    from: optionalString,
    to: optionalString,
    start_date: optionalString,
    end_date: optionalString,
    group_by: z.preprocess(
      emptyToUndefined,
      z
        .enum([
          "day",
          "week",
          "month",
          "year",
          "product",
          "variant",
          "category",
          "currency",
        ])
        .optional()
    ),
    order_status: optionalString,
    product_id: optionalString,
    variant_id: optionalString,
    category_id: optionalString,
    customer_id: optionalString,
    currency: optionalString,
  })
)

export type AdminGetMarginReportParamsType = z.infer<
  typeof AdminGetMarginReportParams
>
