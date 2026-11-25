import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyGatewayPayment } from "../gateway"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id, authority, ref_id, status } = req.validatedBody as {
    cart_id: string
    authority?: string
    ref_id?: string
    status?: string
  }

  const result = await verifyGatewayPayment(req.scope, {
    cartId: cart_id,
    authority,
    refId: ref_id,
    status,
  })

  return res.status(200).json(result)
}
