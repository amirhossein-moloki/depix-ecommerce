import { OrderStatus } from "@medusajs/framework/utils"

export const ADMIN_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "canceled",
  "cancelled",
  "archived",
  "requires_action",
] as const

export const ORDER_FULFILLMENT_STATUSES = [
  "not_fulfilled",
  "partially_fulfilled",
  "fulfilled",
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
  "canceled",
] as const

export const CANCELLABLE_CUSTOMER_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
] as const

/**
 * Normalizes order status aliases (e.g., "cancelled" -> "canceled").
 */
export function normalizeOrderStatus(status: string): string {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
  return normalized === "cancelled" ? "canceled" : normalized
}

/**
 * Maps storefront/admin e-commerce status strings to Medusa core OrderStatus enum values.
 */
export function mapStatusToCoreOrderStatus(status: string): OrderStatus {
  switch (normalizeOrderStatus(status)) {
    case "canceled":
      return OrderStatus.CANCELED
    case "completed":
    case "delivered":
      return OrderStatus.COMPLETED
    case "archived":
      return OrderStatus.ARCHIVED
    case "requires_action":
      return OrderStatus.REQUIRES_ACTION
    case "pending":
    case "confirmed":
    case "processing":
    case "shipped":
    default:
      return OrderStatus.PENDING
  }
}

/**
 * Maps an admin order status transition to the corresponding default fulfillment status.
 */
export function defaultFulfillmentStatusForOrderStatus(
  status: string
): string | undefined {
  switch (normalizeOrderStatus(status)) {
    case "pending":
    case "confirmed":
      return "not_fulfilled"
    case "processing":
      return "fulfilled"
    case "shipped":
      return "shipped"
    case "delivered":
    case "completed":
      return "delivered"
    case "canceled":
      return "canceled"
    default:
      return undefined
  }
}

/**
 * Hydrates fulfillment_status from order.metadata when core Medusa fulfillments have not progressed past "not_fulfilled".
 */
export function applyOrderStatusMetadata<T extends Record<string, any>>(
  order: T
): T {
  if (!order || typeof order !== "object") {
    return order
  }

  const metaFulfillment = order.metadata?.fulfillment_status
  if (
    (!order.fulfillment_status ||
      order.fulfillment_status === "not_fulfilled") &&
    typeof metaFulfillment === "string" &&
    (ORDER_FULFILLMENT_STATUSES as readonly string[]).includes(metaFulfillment)
  ) {
    ;(order as any).fulfillment_status = metaFulfillment
  }

  return order
}
