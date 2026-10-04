import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ProcessPriceChangeStepInput = {
  variant_id: string
  currency_code: string
  old_price: number
  new_price: number
  product_id?: string
  region_id?: string
}

export const processPriceChangeStepId = "process-price-change-step"

export const processPriceChangeStep = createStep(
  processPriceChangeStepId,
  async (input: ProcessPriceChangeStepInput, { container }) => {
    let logger: any = null
    try {
      logger = container.resolve(ContainerRegistrationKeys.LOGGER, { allowUnregistered: true })
    } catch {
      // optional logger
    }

    const priceAlertService = container.resolve<any>(Modules.PRICE_ALERT, { allowUnregistered: true })
    const notificationService = container.resolve<any>(Modules.NOTIFICATION, { allowUnregistered: true })
    const customerService = container.resolve<any>(Modules.CUSTOMER, { allowUnregistered: true })
    const productService = container.resolve<any>(Modules.PRODUCT, { allowUnregistered: true })
    const eventBusService = container.resolve<any>(Modules.EVENT_BUS, { allowUnregistered: true })

    if (!priceAlertService) {
      return new StepResponse({ notifiedCount: 0, alerts: [] })
    }

    const currencyCode = input.currency_code?.toLowerCase()
    const oldPrice = Number(input.old_price)
    const newPrice = Number(input.new_price)

    // Retrieve product info if not provided
    let productId = input.product_id
    if (!productId && productService?.retrieveProductVariant) {
      try {
        const variant = await productService.retrieveProductVariant(input.variant_id)
        productId = variant?.product_id ?? variant?.product?.id
      } catch {
        // Fallback
      }
    }

    // Fetch active price alerts for this variant and currency
    const [activeAlerts] = await priceAlertService.listAndCountPriceAlerts({
      variant_id: input.variant_id,
      currency_code: currencyCode,
      status: "active",
    })

    if (!activeAlerts || activeAlerts.length === 0) {
      return new StepResponse({ notifiedCount: 0, alerts: [] })
    }

    const processedAlerts: any[] = []

    for (const alert of activeAlerts) {
      let currentAlert: any
      try {
        currentAlert = await priceAlertService.retrievePriceAlert(alert.id)
      } catch {
        continue
      }

      if (currentAlert.status !== "active") {
        continue
      }

      // Check region match if alert specifies a region_id
      if (currentAlert.region_id && input.region_id && currentAlert.region_id !== input.region_id) {
        continue
      }

      // Determine if trigger condition is met
      let shouldTrigger = false
      const alertType = currentAlert.alert_type || "price_drop"

      if (alertType === "any_change") {
        shouldTrigger = oldPrice !== newPrice
      } else if (alertType === "price_drop") {
        shouldTrigger = newPrice < oldPrice
      } else if (alertType === "target_price") {
        const targetPrice = Number(currentAlert.target_price)
        shouldTrigger = !isNaN(targetPrice) && newPrice <= targetPrice
      }

      if (!shouldTrigger) {
        continue
      }

      let customerEmail = ""
      let customerPhone = ""
      if (customerService?.retrieveCustomer) {
        try {
          const customer = await customerService.retrieveCustomer(alert.customer_id)
          if (customer) {
            customerEmail = customer.email || ""
            customerPhone = customer.phone || ""
          }
        } catch {
          // Fallback
        }
      }

      const channel = alert.channel || "in-app"
      const notificationPayload = {
        to: customerEmail || alert.customer_id,
        channel: channel,
        template: "price-alert-triggered",
        trigger_type: "price_alert.triggered",
        resource_id: alert.id,
        resource_type: "price_alert",
        receiver_id: alert.customer_id,
        idempotency_key: `price_alert_${alert.id}`,
        data: {
          customer_id: alert.customer_id,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          product_id: alert.product_id || productId || "",
          variant_id: alert.variant_id,
          old_price: String(oldPrice),
          new_price: String(newPrice),
          currency_code: currencyCode,
          alert_id: alert.id,
          alert_type: alertType,
          channel: channel,
        },
      }

      let notificationSuccess = false
      try {
        if (notificationService?.createNotifications) {
          await notificationService.createNotifications(notificationPayload)
          notificationSuccess = true
        } else {
          notificationSuccess = true
        }
      } catch (err: any) {
        logger?.error?.(
          `Failed to create price alert notification for alert ${alert.id}: ${err.message}`
        )
      }

      if (notificationSuccess) {
        const updated = await priceAlertService.updatePriceAlerts({
          id: alert.id,
          status: "notified",
          notified_at: new Date(),
        })
        processedAlerts.push(updated)

        // Emit domain event for external listeners / audit
        try {
          if (eventBusService?.emit) {
            await eventBusService.emit([
              {
                name: "price_alert.triggered",
                data: {
                  alert_id: alert.id,
                  customer_id: alert.customer_id,
                  product_id: alert.product_id || productId,
                  variant_id: alert.variant_id,
                  old_price: oldPrice,
                  new_price: newPrice,
                  currency_code: currencyCode,
                  alert_type: alertType,
                },
              },
            ])
          }
        } catch {
          // Non-blocking
        }
      } else {
        const updated = await priceAlertService.updatePriceAlerts({
          id: alert.id,
          status: "failed",
        })
        processedAlerts.push(updated)
      }
    }

    return new StepResponse({
      notifiedCount: processedAlerts.length,
      alerts: processedAlerts,
    })
  }
)
