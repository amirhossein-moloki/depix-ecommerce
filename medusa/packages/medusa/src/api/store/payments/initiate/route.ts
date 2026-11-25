import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { initiateGatewayPayment } from "../gateway"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id, provider, callback_url } = req.validatedBody as {
    cart_id: string
    provider?: string
    callback_url: string
  }

  const result = await initiateGatewayPayment(req.scope, {
    cartId: cart_id,
    provider,
    callbackUrl: callback_url,
  })

  return res.status(200).json(result)
}
