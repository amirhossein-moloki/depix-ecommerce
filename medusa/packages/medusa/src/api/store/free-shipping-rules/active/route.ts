import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getActiveFreeShippingStatus } from "../../shipping-options/free-shipping"

/**
 * @oas [get] /store/free-shipping-rules/active
 * operationId: "StoreGetActiveFreeShippingRules"
 * summary: "Get Active Free Shipping Rules"
 * description: "Returns active free shipping rule status and optional cart eligibility / remaining threshold in IRR."
 * x-authenticated: false
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId =
    typeof req.query?.cart_id === "string" ? req.query.cart_id : undefined

  const { status, activeRules } = await getActiveFreeShippingStatus(
    req.scope,
    cartId
  )

  res.status(200).json({
    free_shipping: status,
    rules: activeRules,
  })
}
