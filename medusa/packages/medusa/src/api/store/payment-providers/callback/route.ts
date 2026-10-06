import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * Handle PSP gateway callbacks/redirects and perform mandatory server-side verification.
 * POST/GET /store/payment-providers/callback
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { gateway, session_id, payment_collection_id, ...callbackParams } =
    (req.body as Record<string, unknown>) || {}

  if (!gateway) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Gateway parameter 'gateway' is required for payment callback."
    )
  }

  const paymentModuleService = req.scope.resolve("payment")

  try {
    // Process authorization/verification via Medusa Payment Module
    if (payment_collection_id && session_id) {
      const session = await paymentModuleService.authorizePaymentSession(
        session_id as string,
        {
          callbackData: callbackParams,
          gateway,
        }
      )

      return res.status(200).json({
        success: true,
        status: session.status,
        session_id: session.id,
        message: "Payment callback processed and verified.",
      })
    }

    return res.status(200).json({
      success: true,
      gateway,
      callbackData: callbackParams,
      message: "Callback received.",
    })
  } catch (error: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Payment verification failed after callback: ${error.message}`
    )
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const queryParams = req.query as Record<string, unknown>
  req.body = queryParams
  return POST(req, res)
}
