import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CreateStockAlertStepInput = {
  customer_id: string
  product_id: string
  variant_id: string
  channel?: string
  metadata?: Record<string, unknown> | null
}

export const createStockAlertStepId = "create-stock-alert-step"

export const createStockAlertStep = createStep(
  createStockAlertStepId,
  async (input: CreateStockAlertStepInput, { container }) => {
    const channel = (input.channel || "sms").toLowerCase()
    const supportedChannels = ["sms", "email"]
    if (!supportedChannels.includes(channel)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported notification channel: ${input.channel}. Supported channels are: ${supportedChannels.join(", ")}`
      )
    }

    const customerService = container.resolve<any>(Modules.CUSTOMER)
    const productService = container.resolve<any>(Modules.PRODUCT)
    const stockAlertService = container.resolve<any>(Modules.STOCK_ALERT)

    // 1. Verify customer exists
    try {
      await customerService.retrieveCustomer(input.customer_id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer with id ${input.customer_id} not found`
      )
    }

    // 2. Verify product exists
    try {
      await productService.retrieveProduct(input.product_id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${input.product_id} not found`
      )
    }

    // 3. Verify variant exists
    let variant: any
    try {
      variant = await productService.retrieveProductVariant(input.variant_id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product variant with id ${input.variant_id} not found`
      )
    }

    // 4. Verify variant belongs to product
    const variantProductId = variant.product_id ?? variant.product?.id
    if (variantProductId && variantProductId !== input.product_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Product variant ${input.variant_id} does not belong to product ${input.product_id}`
      )
    }

    // 5. Check for duplicate active subscription
    const [existingAlerts] = await stockAlertService.listAndCountStockAlerts({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id,
      channel,
      status: "active",
    })

    if (existingAlerts.length > 0) {
      return new StepResponse(existingAlerts[0], { createdId: null })
    }

    // 6. Create stock alert
    const newAlert = await stockAlertService.createStockAlerts({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id,
      channel,
      status: "active",
      metadata: input.metadata ?? null,
    })

    return new StepResponse(newAlert, { createdId: newAlert.id })
  },
  async (compensateData, { container }) => {
    if (compensateData?.createdId) {
      const stockAlertService = container.resolve<any>(Modules.STOCK_ALERT)
      await stockAlertService.deleteStockAlerts([compensateData.createdId])
    }
  }
)
