import { z } from "@medusajs/framework/zod"
import { applyAndAndOrOperators } from "../../utils/common-validators"
import { createFindParams, createSelectParams } from "../../utils/validators"

export type ReturnParamsType = z.infer<typeof ReturnParams>
export const ReturnParams = createSelectParams()

export const ReturnsParamsFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  order_id: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.string().optional(),
})

export type ReturnsParamsType = z.infer<typeof ReturnsParams>
export const ReturnsParams = createFindParams({
  limit: 20,
  offset: 0,
})
  .merge(ReturnsParamsFields)
  .merge(applyAndAndOrOperators(ReturnsParamsFields))

const ReturnShippingSchema = z.object({
  option_id: z.string(),
  price: z.number().optional(),
})

const ItemSchema = z
  .object({
    id: z.string().optional(),
    line_item_id: z.string().optional(),
    quantity: z.number().min(1),
    reason_id: z.string().nullish(),
    note: z.string().nullish(),
  })
  .refine((item) => Boolean(item.id || item.line_item_id), {
    message: "Either line_item_id or id is required for each return item",
  })

export const StorePostReturnsReqSchema = z.object({
  order_id: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  return_shipping: ReturnShippingSchema.optional(),
  reason: z.string().nullish(),
  description: z.string().nullish(),
  evidence_urls: z.array(z.string()).optional(),
  note: z.string().nullish(),
  receive_now: z.boolean().optional(),
  location_id: z.string().nullish(),
})
export type StorePostReturnsReqSchemaType = z.infer<
  typeof StorePostReturnsReqSchema
>

export const StoreReturnShipmentSchema = z.object({
  method: z.enum(["post", "tipax", "other"]),
  tracking_code: z.string().min(1),
})
export type StoreReturnShipmentSchemaType = z.infer<
  typeof StoreReturnShipmentSchema
>
