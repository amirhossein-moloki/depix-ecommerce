import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { initiateGatewayPayment } from "../gateway"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id, provider, callback_url, idempotency_key } =
    req.validatedBody as {
      cart_id: string
      provider?: string
      callback_url?: string
      idempotency_key?: string
    }

  const result = await initiateGatewayPayment(req.scope, {
    cartId: cart_id,
    provider,
    callbackUrl: callback_url,
    idempotencyKey: idempotency_key,
    customerId: (req as AuthenticatedMedusaRequest).auth_context?.actor_id,
  })

  return res.status(200).json(result)
}
