import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  HybridRecommendationProvider,
  MLRecommendationProvider,
  RecommendationProvider,
  RuleBasedRecommendationProvider,
} from "@medusajs/recommendation"

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
  provider_override?: "RULE_BASED" | "ML" | "HYBRID"
}

export const getRecommendationsStepId = "get-recommendations"

export const getRecommendationsStep = createStep(
  getRecommendationsStepId,
  async (input: GetRecommendationsStepInput, { container }) => {
    const isMlEnabled = process.env.ML_RECOMMENDATIONS_ENABLED !== "false"
    const configuredProvider =
      input.provider_override || process.env.ML_PROVIDER || "HYBRID"

    let provider: RecommendationProvider

    if (!isMlEnabled || configuredProvider === "RULE_BASED") {
      provider = new RuleBasedRecommendationProvider()
    } else if (configuredProvider === "ML") {
      provider = new MLRecommendationProvider()
    } else {
      provider = new HybridRecommendationProvider()
    }

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
