import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RuleBasedRecommendationProvider } from "@medusajs/recommendation"

export type GetRecommendationsStepInput = {
  product_id?: string
  customer_id?: string
  cart_id?: string
  type?: "SIMILAR" | "RELATED" | "FREQUENTLY_BOUGHT_TOGETHER" | "POPULAR" | "TRENDING" | "CUSTOMER_AWARE"
  context_type?: "PRODUCT_PAGE" | "CART" | "CHECKOUT" | "CUSTOMER_HOME" | "WISHLIST"
  limit?: number
  offset?: number
  period?: string
  exclude_product_ids?: string[]
}

export const getRecommendationsStepId = "get-recommendations"

export const getRecommendationsStep = createStep(
  getRecommendationsStepId,
  async (input: GetRecommendationsStepInput, { container }) => {
    const provider = new RuleBasedRecommendationProvider()
    const result = await provider.getRecommendations(
      {
        productId: input.product_id,
        customerId: input.customer_id,
        cartId: input.cart_id,
        type: input.type,
        contextType: input.context_type,
        limit: input.limit,
        offset: input.offset,
        period: input.period,
        excludeProductIds: input.exclude_product_ids,
      },
      container
    )

    return new StepResponse(result)
  }
)
