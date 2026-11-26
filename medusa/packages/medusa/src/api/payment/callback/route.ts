import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleZibalCallback } from "../../store/payments/gateway"

async function handleCallback(req: MedusaRequest, res: MedusaResponse) {
  const result = await handleZibalCallback(req.scope, {
    query: (req.query as Record<string, unknown>) || {},
    body: (req.body as Record<string, unknown>) || {},
    headers: req.headers,
  })

  return res.redirect(result.statusCode, result.redirectUrl)
}

export const GET = handleCallback
export const POST = handleCallback
