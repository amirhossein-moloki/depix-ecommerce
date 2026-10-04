import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CreatePriceAlertStepInput = {
  customer_id: string
  product_id: string
  variant_id: string
  currency_code: string
  region_id?: string | null
  alert_type?: string
  reference_price?: number | null
  target_price?: number | null
  channel?: string
  metadata?: Record<string, unknown> | null
}

export const createPriceAlertStepId = "create-price-alert-step"

export const createPriceAlertStep = createStep(
  createPriceAlertStepId,
  async (input: CreatePriceAlertStepInput, { container }) => {
    const channel = (input.channel || "in-app").toLowerCase()
    const supportedChannels = ["in-app", "email", "sms"]
    if (!supportedChannels.includes(channel)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported notification channel: ${input.channel}. Supported channels are: ${supportedChannels.join(", ")}`
      )
    }

    const alertType = (input.alert_type || "price_drop").toLowerCase()
    const validAlertTypes = ["any_change", "price_drop", "target_price"]
    if (!validAlertTypes.includes(alertType)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid alert_type: ${input.alert_type}. Supported types are: ${validAlertTypes.join(", ")}`
      )
    }

    const currencyCode = input.currency_code?.toLowerCase()
    if (!currencyCode) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "currency_code is required"
      )
    }

    if (alertType === "target_price" && (input.target_price === undefined || input.target_price === null || input.target_price <= 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "target_price must be a positive number when alert_type is 'target_price'"
      )
    }

    const customerService = container.resolve<any>(Modules.CUSTOMER)
    const productService = container.resolve<any>(Modules.PRODUCT)
    const priceAlertService = container.resolve<any>(Modules.PRICE_ALERT)

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
    const [existingAlerts] = await priceAlertService.listAndCountPriceAlerts({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id,
      currency_code: currencyCode,
      alert_type: alertType,
      status: "active",
    })

    if (existingAlerts.length > 0) {
      return new StepResponse(existingAlerts[0], { createdId: null })
    }

    // 6. Create price alert
    const newAlert = await priceAlertService.createPriceAlerts({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id,
      currency_code: currencyCode,
      region_id: input.region_id ?? null,
      alert_type: alertType,
      reference_price: input.reference_price ?? 0,
      target_price: input.target_price ?? null,
      channel,
      status: "active",
      metadata: input.metadata ?? null,
    })

    return new StepResponse(newAlert, { createdId: newAlert.id })
  },
  async (compensateData, { container }) => {
    if (compensateData?.createdId) {
      const priceAlertService = container.resolve<any>(Modules.PRICE_ALERT)
      await priceAlertService.deletePriceAlerts([compensateData.createdId])
    }
  }
)
