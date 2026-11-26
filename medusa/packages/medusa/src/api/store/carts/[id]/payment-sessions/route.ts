import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { initiateGatewayPayment } from "../../../payments/gateway"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { provider, callback_url, idempotency_key } = req.validatedBody as {
    provider?: string
    callback_url?: string
    idempotency_key?: string
  }

  const result = await initiateGatewayPayment(req.scope, {
    cartId: req.params.id,
    provider,
    callbackUrl: callback_url,
    idempotencyKey: idempotency_key,
  })

  return res.status(200).json(result)
}
