import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const stockAlertService = req.scope.resolve<any>(Modules.STOCK_ALERT)
  const alertId = req.params.id

  let stockAlert: any
  try {
    stockAlert = await stockAlertService.retrieveStockAlert(alertId)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock alert with id ${alertId} not found`
    )
  }

  res.json({ stock_alert: stockAlert })
}
