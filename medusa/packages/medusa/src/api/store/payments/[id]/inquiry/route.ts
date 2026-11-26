import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { inquireGatewayPayment } from "../../gateway"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const result = await inquireGatewayPayment(req.scope, req.params.id)
  return res.status(200).json(result)
}
