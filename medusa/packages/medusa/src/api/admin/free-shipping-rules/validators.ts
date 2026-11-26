import { z } from "@medusajs/framework/zod"
import { booleanString } from "../../utils/common-validators/common"
import { createFindParams } from "../../utils/validators"

export const FreeShippingRuleScopeEnum = z.enum([
  "store",
  "products",
  "categories",
  "campaign",
])

export type AdminGetFreeShippingRulesParamsType = z.infer<
  typeof AdminGetFreeShippingRulesParams
>
export const AdminGetFreeShippingRulesParams = createFindParams({
  limit: 20,
  offset: 0,
})
  .merge(
    z.object({
      q: z.string().optional(),
      scope: FreeShippingRuleScopeEnum.optional(),
      is_active: booleanString().optional(),
    })
  )
  .strict()

export type AdminCreateFreeShippingRuleType = z.infer<
  typeof AdminCreateFreeShippingRule
>
export const AdminCreateFreeShippingRule = z
  .object({
    title: z.string().min(1),
    description: z.string().nullish(),
    scope: FreeShippingRuleScopeEnum.default("store"),
    product_ids: z.array(z.string()).nullish(),
    category_ids: z.array(z.string()).nullish(),
    campaign_id: z.string().nullish(),
    min_purchase_amount: z.number().nonnegative().nullish(),
    max_purchase_amount: z.number().nonnegative().nullish(),
    usage_limit: z.number().int().min(1).nullish(),
    used_count: z.number().int().min(0).optional(),
    starts_at: z.coerce.date().nullish(),
    ends_at: z.coerce.date().nullish(),
    is_active: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type AdminUpdateFreeShippingRuleType = z.infer<
  typeof AdminUpdateFreeShippingRule
>
export const AdminUpdateFreeShippingRule = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullish(),
    scope: FreeShippingRuleScopeEnum.optional(),
    product_ids: z.array(z.string()).nullish(),
    category_ids: z.array(z.string()).nullish(),
    campaign_id: z.string().nullish(),
    min_purchase_amount: z.number().nonnegative().nullish(),
    max_purchase_amount: z.number().nonnegative().nullish(),
    usage_limit: z.number().int().min(1).nullish(),
    used_count: z.number().int().min(0).optional(),
    starts_at: z.coerce.date().nullish(),
    ends_at: z.coerce.date().nullish(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()
