import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  AdminCreateFreeShippingRuleType,
  AdminGetFreeShippingRulesParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetFreeShippingRulesParamsType>,
  res: MedusaResponse
) => {
  const promotionService = req.scope.resolve<any>(Modules.PROMOTION)
  const skip =
    req.queryConfig?.pagination?.skip ?? req.validatedQuery?.offset ?? 0
  const take =
    req.queryConfig?.pagination?.take ?? req.validatedQuery?.limit ?? 20

  const filters: Record<string, any> = {}
  if (req.validatedQuery?.q) {
    filters.q = req.validatedQuery.q
  }
  if (req.validatedQuery?.scope) {
    filters.scope = req.validatedQuery.scope
  }
  if (req.validatedQuery?.is_active !== undefined) {
    filters.is_active = req.validatedQuery.is_active
  }

  const [free_shipping_rules, count] =
    await promotionService.listAndCountFreeShippingRules(filters, {
      skip,
      take,
      order: { created_at: "DESC" },
    })

  res.json({
    free_shipping_rules,
    count,
    offset: skip,
    limit: take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateFreeShippingRuleType>,
  res: MedusaResponse
) => {
  const promotionService = req.scope.resolve<any>(Modules.PROMOTION)
  const {
    title,
    scope,
    product_ids,
    category_ids,
    campaign_id,
    min_purchase_amount,
    starts_at,
    ends_at,
    is_active,
    metadata,
  } = req.validatedBody

  const free_shipping_rule = await promotionService.createFreeShippingRules({
    title,
    scope,
    product_ids: product_ids ?? null,
    category_ids: category_ids ?? null,
    campaign_id: campaign_id ?? null,
    min_purchase_amount: min_purchase_amount ?? null,
    starts_at: starts_at ?? null,
    ends_at: ends_at ?? null,
    is_active,
    metadata: metadata ?? null,
  })

  res.status(201).json({ free_shipping_rule })
}
