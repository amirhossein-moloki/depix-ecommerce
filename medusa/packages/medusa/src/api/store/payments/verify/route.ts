import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { verifyGatewayPayment } from "../gateway"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id, payment_id, authority, track_id, ref_id, status, provider } =
    req.validatedBody as {
      cart_id?: string
      payment_id?: string
      authority?: string
      track_id?: string | number
      ref_id?: string
      status?: string
      provider?: string
    }

  const result = await verifyGatewayPayment(req.scope, {
    cartId: cart_id,
    paymentId: payment_id,
    authority,
    trackId: track_id !== undefined ? String(track_id) : undefined,
    refId: ref_id,
    status,
    provider,
    customerId: (req as AuthenticatedMedusaRequest).auth_context?.actor_id,
  })

  return res.status(200).json(result)
}
