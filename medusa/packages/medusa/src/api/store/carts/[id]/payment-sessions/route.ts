import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { initiateGatewayPayment } from "../../../payments/gateway"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { provider, callback_url } = req.validatedBody as {
    provider?: string
    callback_url: string
  }

  const result = await initiateGatewayPayment(req.scope, {
    cartId: req.params.id,
    provider,
    callbackUrl: callback_url,
  })

  return res.status(200).json(result)
}
