import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CancelPriceAlertStepInput = {
  id: string
  customer_id: string
}

export const cancelPriceAlertStepId = "cancel-price-alert-step"

export const cancelPriceAlertStep = createStep(
  cancelPriceAlertStepId,
  async (input: CancelPriceAlertStepInput, { container }) => {
    const priceAlertService = container.resolve<any>(Modules.PRICE_ALERT)

    let alert: any
    try {
      alert = await priceAlertService.retrievePriceAlert(input.id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Price alert with id ${input.id} not found`
      )
    }

    if (alert.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Customer ${input.customer_id} is not allowed to cancel price alert ${input.id}`
      )
    }

    if (alert.status === "cancelled") {
      return new StepResponse(alert, { id: alert.id, previousStatus: alert.status })
    }

    const updatedAlert = await priceAlertService.updatePriceAlerts({
      id: input.id,
      status: "cancelled",
    })

    return new StepResponse(updatedAlert, {
      id: alert.id,
      previousStatus: alert.status,
    })
  },
  async (compensateData, { container }) => {
    if (compensateData?.id && compensateData?.previousStatus) {
      const priceAlertService = container.resolve<any>(Modules.PRICE_ALERT)
      await priceAlertService.updatePriceAlerts({
        id: compensateData.id,
        status: compensateData.previousStatus,
      })
    }
  }
)
