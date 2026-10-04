import {
  ContainerRegistrationKeys,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import { createInvoiceWorkflow } from "@medusajs/core-flows"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"

export default async function invoiceOrderPlacedHandler({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER, {
    allowUnregistered: true,
  })

  const payload = event.data || {}
  const orderId = payload.id || payload.order_id

  if (!orderId) {
    return
  }

  try {
    await createInvoiceWorkflow(container).run({
      input: {
        order_id: orderId,
      },
    })
  } catch (err: any) {
    logger?.error?.(
      `Failed to create invoice for order ${orderId} on event ${event.name}: ${err.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    OrderWorkflowEvents.PLACED,
    OrderWorkflowEvents.COMPLETED,
    "order.placed",
    "order.completed",
  ],
  context: {
    subscriberId: "invoice-order-placed-subscriber",
  },
}
