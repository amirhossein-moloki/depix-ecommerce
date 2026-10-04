export const RecommendationEventNames = {
  PRODUCT_VIEWED: "product.viewed",
  PRODUCT_ADDED_TO_CART: "product.added_to_cart",
  PRODUCT_REMOVED_FROM_CART: "product.removed_from_cart",
  WISHLIST_ADDED: "wishlist.added",
  WISHLIST_REMOVED: "wishlist.removed",
  CHECKOUT_STARTED: "checkout.started",
  ORDER_COMPLETED: "order.completed",
  PRODUCT_PURCHASED: "product.purchased",
  RECOMMENDATION_REQUESTED: "recommendation.requested",
  RECOMMENDATION_SELECTED: "recommendation.selected",
} as const

export type RecommendationEventPayload = {
  event_name: string
  timestamp: string
  product_id?: string
  customer_id?: string
  cart_id?: string
  order_id?: string
  recommendation_type?: string
  recommendation_request_id?: string
  recommended_product_ids?: string[]
  selected_product_id?: string
  source?: string
  metadata?: Record<string, any>
}

export async function emitRecommendationEvent(
  eventBusModule: any,
  eventName: string,
  data: Omit<RecommendationEventPayload, "event_name" | "timestamp">
): Promise<void> {
  if (!eventBusModule || typeof eventBusModule.emit !== "function") {
    return
  }

  const payload: RecommendationEventPayload = {
    event_name: eventName,
    timestamp: new Date().toISOString(),
    ...data,
  }

  try {
    await eventBusModule.emit({
      name: eventName,
      data: payload,
    })
  } catch (err) {
    // Fail safe logging without crashing request
    console.error(`Failed to emit recommendation event ${eventName}:`, err)
  }
}
