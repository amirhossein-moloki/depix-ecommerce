import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const priceAlertService = req.scope.resolve<any>(Modules.PRICE_ALERT)

  let alert: any
  try {
    alert = await priceAlertService.retrievePriceAlert(id)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Price alert with id ${id} not found`
    )
  }

  res.json({ price_alert: alert })
}
