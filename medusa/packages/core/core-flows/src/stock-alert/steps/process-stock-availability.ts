import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ProcessStockAvailabilityStepInput = {
  variant_id: string
  inventory_item_id?: string
}

export const processStockAvailabilityStepId = "process-stock-availability-step"

export const processStockAvailabilityStep = createStep(
  processStockAvailabilityStepId,
  async (input: ProcessStockAvailabilityStepInput, { container }) => {
    let logger: any = null
    try {
      logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    } catch {
      // optional logger
    }

    const productService = container.resolve<any>(Modules.PRODUCT)
    const stockAlertService = container.resolve<any>(Modules.STOCK_ALERT)
    const notificationService = container.resolve<any>(Modules.NOTIFICATION)
    const customerService = container.resolve<any>(Modules.CUSTOMER)

    let variant: any
    try {
      variant = await productService.retrieveProductVariant(input.variant_id)
    } catch {
      return new StepResponse({ notifiedCount: 0, alerts: [] })
    }

    let isAvailable = false

    if (variant.manage_inventory === false) {
      isAvailable = true
    } else {
      let inventoryItemId = input.inventory_item_id
      if (!inventoryItemId) {
        try {
          const query = container.resolve(ContainerRegistrationKeys.QUERY)
          const { data: variantData } = await query.graph({
            entity: "product_variant",
            fields: ["id", "inventory_items.inventory_item_id"],
            filters: { id: input.variant_id },
          })
          if (variantData?.[0]?.inventory_items?.[0]?.inventory_item_id) {
            inventoryItemId = variantData[0].inventory_items[0].inventory_item_id
          }
        } catch {
          // Fallback if query graph fails
        }
      }

      if (inventoryItemId) {
        try {
          const inventoryService = container.resolve<any>(Modules.INVENTORY)
          const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItemId,
          })
          const totalAvailable = levels.reduce((acc: number, level: any) => {
            const avail = (level.stocked_quantity || 0) - (level.reserved_quantity || 0)
            return acc + (avail > 0 ? avail : 0)
          }, 0)
          if (totalAvailable > 0) {
            isAvailable = true
          }
        } catch {
          // If inventory check fails, assume available if manage_inventory is not strictly blocking
        }
      }
    }

    if (!isAvailable) {
      return new StepResponse({ notifiedCount: 0, alerts: [] })
    }

    // Fetch active stock alerts for this variant
    const [activeAlerts] = await stockAlertService.listAndCountStockAlerts({
      variant_id: input.variant_id,
      status: "active",
    })

    if (!activeAlerts || activeAlerts.length === 0) {
      return new StepResponse({ notifiedCount: 0, alerts: [] })
    }

    const processedAlerts: any[] = []

    // Batch processing
    for (const alert of activeAlerts) {
      let currentAlert: any
      try {
        currentAlert = await stockAlertService.retrieveStockAlert(alert.id)
      } catch {
        continue
      }

      if (currentAlert.status !== "active") {
        continue
      }

      let toDestination = alert.customer_id
      try {
        const customer = await customerService.retrieveCustomer(alert.customer_id)
        if (customer) {
          toDestination = customer.phone || customer.email || alert.customer_id
        }
      } catch {
        // Fallback destination to customer_id if customer lookup fails
      }

      const notificationPayload = {
        to: toDestination,
        channel: alert.channel || "sms",
        template: "back-in-stock",
        trigger_type: "stock_alert.triggered",
        resource_id: alert.id,
        resource_type: "stock_alert",
        receiver_id: alert.customer_id,
        data: {
          customer_id: alert.customer_id,
          product_id: alert.product_id,
          variant_id: alert.variant_id,
          stock_alert_id: alert.id,
          channel: alert.channel,
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
          `Failed to create back-in-stock notification for alert ${alert.id}: ${err.message}`
        )
      }

      if (notificationSuccess) {
        const updated = await stockAlertService.updateStockAlerts({
          id: alert.id,
          status: "notified",
          notified_at: new Date(),
        })
        processedAlerts.push(updated)
      } else {
        const updated = await stockAlertService.updateStockAlerts({
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
