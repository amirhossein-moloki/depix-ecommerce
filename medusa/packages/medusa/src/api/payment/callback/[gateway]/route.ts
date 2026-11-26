import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  buildFailedRedirectUrl,
  parsePaymentEnv,
} from "../../../store/payments/config"
import { handleZibalCallback } from "../../../store/payments/gateway"

async function handleGatewayCallback(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const gateway = String(req.params.gateway || "")
    .trim()
    .toLowerCase()

  if (gateway === "zibal") {
    const result = await handleZibalCallback(req.scope, {
      query: (req.query as Record<string, unknown>) || {},
      body: (req.body as Record<string, unknown>) || {},
      headers: req.headers,
    })
    return res.redirect(result.statusCode, result.redirectUrl)
  }

  try {
    const env = parsePaymentEnv(process.env.PAYMENT_ENV)
    const redirectUrl = buildFailedRedirectUrl(process.env.APP_URL, env, {
      reason: "unsupported_gateway",
    })
    return res.redirect(302, redirectUrl)
  } catch {
    return res.status(404).json({
      type: "not_found",
      message: `Unsupported payment gateway '${gateway}'`,
    })
  }
}

export const GET = handleGatewayCallback
export const POST = handleGatewayCallback
