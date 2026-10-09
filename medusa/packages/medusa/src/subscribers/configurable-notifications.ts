import { INotificationModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  pickValueFromObject,
  promiseAll,
} from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"

type HandlerConfig = {
  event: string
  template: string
  channel: string
  to: string | string[]
  resource_id: string
  resource_type?: string
  receiver_id?: string
  data: Record<string, string>
}

const handlerConfig: HandlerConfig[] = [
  // Email Order Created
  {
    event: "order.created",
    template: "order-created-template",
    channel: "email",
    to: "order.email",
    resource_id: "order.id",
    data: {
      order_id: "order.id",
    },
  },
  // SMS Order Created
  {
    event: "order.created",
    template: "order-created-template",
    channel: "sms",
    to: ["order.shipping_address.phone", "order.billing_address.phone", "order.phone", "phone", "customer_phone"],
    resource_id: "order.id",
    resource_type: "order",
    receiver_id: "order.customer_id",
    data: {
      order_id: "order.id",
    },
  },
  // In-App Order Placed
  {
    event: "order.placed",
    template: "order-placed",
    channel: "in-app",
    to: "order.email",
    resource_id: "order.id",
    resource_type: "order",
    receiver_id: "order.customer_id",
    data: {
      title: "Order Placed",
      message: "Your order has been placed successfully.",
      order_id: "order.id",
    },
  },
  // SMS Order Placed
  {
    event: "order.placed",
    template: "order-placed",
    channel: "sms",
    to: ["order.shipping_address.phone", "order.billing_address.phone", "order.phone", "phone", "customer_phone"],
    resource_id: "order.id",
    resource_type: "order",
    receiver_id: "order.customer_id",
    data: {
      order_id: "order.id",
    },
  },
  // In-App Order Canceled
  {
    event: "order.canceled",
    template: "order-canceled",
    channel: "in-app",
    to: "order.email",
    resource_id: "order.id",
    resource_type: "order",
    receiver_id: "order.customer_id",
    data: {
      title: "Order Canceled",
      message: "Your order has been canceled.",
      order_id: "order.id",
    },
  },
  // SMS Order Canceled
  {
    event: "order.canceled",
    template: "order-canceled",
    channel: "sms",
    to: ["order.shipping_address.phone", "order.billing_address.phone", "order.phone", "phone", "customer_phone"],
    resource_id: "order.id",
    resource_type: "order",
    receiver_id: "order.customer_id",
    data: {
      order_id: "order.id",
    },
  },
  // In-App Payment Captured
  {
    event: "payment.captured",
    template: "payment-captured",
    channel: "in-app",
    to: "payment.email",
    resource_id: "payment.id",
    resource_type: "payment",
    receiver_id: "customer_id",
    data: {
      title: "Payment Captured",
      message: "Your payment was captured successfully.",
      payment_id: "payment.id",
    },
  },
  // SMS Payment Captured
  {
    event: "payment.captured",
    template: "payment-captured",
    channel: "sms",
    to: ["phone", "customer_phone", "payment.phone"],
    resource_id: "payment.id",
    resource_type: "payment",
    receiver_id: "customer_id",
    data: {
      payment_id: "payment.id",
      order_id: "order_id",
    },
  },
  // In-App Payment Failed
  {
    event: "payment.failed",
    template: "payment-failed",
    channel: "in-app",
    to: "payment.email",
    resource_id: "payment.id",
    resource_type: "payment",
    receiver_id: "customer_id",
    data: {
      title: "Payment Failed",
      message: "Payment processing failed for your order.",
      payment_id: "payment.id",
    },
  },
  // SMS Payment Failed
  {
    event: "payment.failed",
    template: "payment-failed",
    channel: "sms",
    to: ["phone", "customer_phone", "payment.phone"],
    resource_id: "payment.id",
    resource_type: "payment",
    receiver_id: "customer_id",
    data: {
      payment_id: "payment.id",
    },
  },
  // In-App Fulfillment Created
  {
    event: "fulfillment.created",
    template: "shipment-created",
    channel: "in-app",
    to: "fulfillment.email",
    resource_id: "fulfillment.id",
    resource_type: "fulfillment",
    receiver_id: "customer_id",
    data: {
      title: "Shipment Created",
      message: "A shipment has been created for your order.",
      fulfillment_id: "fulfillment.id",
    },
  },
  // SMS Fulfillment Created
  {
    event: "fulfillment.created",
    template: "shipment-created",
    channel: "sms",
    to: ["fulfillment.phone", "phone", "customer_phone"],
    resource_id: "fulfillment.id",
    resource_type: "fulfillment",
    receiver_id: "customer_id",
    data: {
      fulfillment_id: "fulfillment.id",
      order_id: "order_id",
    },
  },
  // Stock Alert In-App & SMS
  {
    event: "stock_alert.triggered",
    template: "stock-alert-triggered",
    channel: "in-app",
    to: "customer_email",
    resource_id: "stock_alert_id",
    resource_type: "stock_alert",
    receiver_id: "customer_id",
    data: {
      title: "Item Back in Stock",
      message: "An item on your stock alert list is back in stock!",
      product_id: "product_id",
      variant_id: "variant_id",
    },
  },
  {
    event: "stock_alert.triggered",
    template: "stock-alert-triggered",
    channel: "sms",
    to: ["phone", "customer_phone", "mobile"],
    resource_id: "stock_alert_id",
    resource_type: "stock_alert",
    receiver_id: "customer_id",
    data: {
      product_id: "product_id",
      variant_id: "variant_id",
    },
  },
  // Price Alert In-App & SMS
  {
    event: "price_alert.triggered",
    template: "price-alert-triggered",
    channel: "in-app",
    to: "customer_email",
    resource_id: "alert_id",
    resource_type: "price_alert",
    receiver_id: "customer_id",
    data: {
      title: "Price Alert Triggered",
      message: "The price for an item on your watchlist has changed!",
      product_id: "product_id",
      variant_id: "variant_id",
      old_price: "old_price",
      new_price: "new_price",
      currency_code: "currency_code",
    },
  },
  {
    event: "price_alert.triggered",
    template: "price-alert-triggered",
    channel: "sms",
    to: ["phone", "customer_phone", "mobile"],
    resource_id: "alert_id",
    resource_type: "price_alert",
    receiver_id: "customer_id",
    data: {
      product_id: "product_id",
      variant_id: "variant_id",
      old_price: "old_price",
      new_price: "new_price",
      currency_code: "currency_code",
    },
  },
  // Auth Verification Requested SMS
  {
    event: "verification.requested",
    template: "verification-requested",
    channel: "sms",
    to: ["phone", "mobile", "entity_id", "to"],
    resource_id: "auth_identity_id",
    resource_type: "verification",
    data: {
      code: "code",
    },
  },
]

const configAsMap = handlerConfig.reduce(
  (acc: Record<string, HandlerConfig[]>, h) => {
    if (!acc[h.event]) {
      acc[h.event] = []
    }

    acc[h.event].push(h)
    return acc
  },
  {}
)

export default async function configurableNotifications({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )

  const handlers = configAsMap[event.name] ?? []
  const payload = event.data

  await promiseAll(
    handlers.map(async (handler) => {
      let recipient: string | null = null

      if (Array.isArray(handler.to)) {
        for (const path of handler.to) {
          const val = pickValueFromObject(path, payload)
          if (val && typeof val === "string" && val.trim().length > 0) {
            recipient = val.trim()
            break
          }
        }
      } else {
        const val = pickValueFromObject(handler.to, payload)
        if (val && typeof val === "string" && val.trim().length > 0) {
          recipient = val.trim()
        }
      }

      // Fallback for non-SMS or missing recipient if default exists
      if (!recipient && handler.channel !== "sms") {
        recipient = "customer"
      }

      // If SMS channel has no recipient phone number, skip safely without erroring
      if (handler.channel === "sms" && (!recipient || recipient === "customer")) {
        logger.debug?.(
          `Skipping SMS notification for ${event.name}: No valid phone number provided.`
        )
        return
      }

      const resourceId = pickValueFromObject(handler.resource_id, payload) || ""
      const receiverId = handler.receiver_id
        ? pickValueFromObject(handler.receiver_id, payload)
        : null

      const idempotencyKey = `${handler.channel}_${handler.event}_${resourceId}_${receiverId || recipient}`

      const notificationData = {
        template: handler.template,
        channel: handler.channel,
        to: recipient!,
        trigger_type: handler.event,
        resource_id: resourceId,
        resource_type: handler.resource_type,
        receiver_id: receiverId,
        idempotency_key: idempotencyKey,
        data: Object.entries(handler.data).reduce(
          (acc: Record<string, any>, [key, value]) => {
            acc[key] = pickValueFromObject(value, payload) || value
            return acc
          },
          {}
        ),
      }

      try {
        await notificationService.createNotifications(notificationData)
      } catch (err: any) {
        logger.error(
          `Failed to send notification for ${event.name}`,
          err.message
        )
      }
    })
  )
}

export const config: SubscriberConfig = {
  event: Array.from(new Set(handlerConfig.map((h) => h.event))),
  context: {
    subscriberId: "configurable-notifications-handler",
  },
}
