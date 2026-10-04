import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"
import { processPriceChangeWorkflow } from "@medusajs/core-flows"

export default async function priceChangeSubscriberHandler({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER, {
    allowUnregistered: true,
  })

  const payload = event.data || {}
  const { variant_id, currency_code, old_price, new_price, product_id, region_id } = payload

  if (!variant_id || !currency_code || old_price === undefined || new_price === undefined) {
    return
  }

  try {
    await processPriceChangeWorkflow(container).run({
      input: {
        variant_id,
        currency_code,
        old_price,
        new_price,
        product_id,
        region_id,
      },
    })
  } catch (err: any) {
    logger?.error?.(
      `Failed to process price change event ${event.name}: ${err.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    "price.changed",
    "price.updated",
    "price_set.updated",
  ],
  context: {
    subscriberId: "price-change-subscriber",
  },
}
