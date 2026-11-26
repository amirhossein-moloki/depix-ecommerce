import { listShippingOptionsForCartWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { getActiveFreeShippingStatus } from "./free-shipping"

export const GET = async (
  req: MedusaRequest<{}, HttpTypes.StoreGetShippingOptionList>,
  res: MedusaResponse<HttpTypes.StoreShippingOptionListResponse>
) => {
  const { cart_id, is_return } = req.filterableFields

  const workflow = listShippingOptionsForCartWorkflow(req.scope)
  const { result: shipping_options } = await workflow.run({
    input: {
      cart_id,
      is_return: !!is_return,
      fields: req.queryConfig.fields,
    },
  })

  const { status: freeShipping } = await getActiveFreeShippingStatus(
    req.scope,
    cart_id
  )

  const enriched = (shipping_options ?? []).map((opt: any) => {
    const amount = Number(
      opt?.calculated_price?.calculated_amount ?? opt?.amount ?? 0
    )
    const isFree = freeShipping.is_eligible || (freeShipping.has_active_rule && amount === 0)
    return {
      ...opt,
      amount: freeShipping.is_eligible ? 0 : amount,
      estimated_days: opt?.data?.estimated_days ?? opt?.metadata?.estimated_days ?? null,
      is_free: isFree,
    }
  })

  res.json({
    shipping_options: enriched as any,
    free_shipping: freeShipping,
  } as any)
}
