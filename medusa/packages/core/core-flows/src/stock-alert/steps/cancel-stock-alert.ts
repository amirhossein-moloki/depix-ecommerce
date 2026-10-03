import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CancelStockAlertStepInput = {
  id: string
  customer_id: string
}

export const cancelStockAlertStepId = "cancel-stock-alert-step"

export const cancelStockAlertStep = createStep(
  cancelStockAlertStepId,
  async (input: CancelStockAlertStepInput, { container }) => {
    const stockAlertService = container.resolve<any>(Modules.STOCK_ALERT)

    let alert: any
    try {
      alert = await stockAlertService.retrieveStockAlert(input.id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Stock alert with id ${input.id} not found`
      )
    }

    if (alert.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Stock alert does not belong to customer ${input.customer_id}`
      )
    }

    const updated = await stockAlertService.updateStockAlerts({
      id: input.id,
      status: "cancelled",
    })

    return new StepResponse(updated, {
      id: input.id,
      previousStatus: alert.status,
    })
  },
  async (compensateData, { container }) => {
    if (compensateData?.id && compensateData?.previousStatus) {
      const stockAlertService = container.resolve<any>(Modules.STOCK_ALERT)
      await stockAlertService.updateStockAlerts({
        id: compensateData.id,
        status: compensateData.previousStatus,
      })
    }
  }
)
