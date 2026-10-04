import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RuleBasedRecommendationProvider } from "@medusajs/recommendation"

export type GetTrendingProductsStepInput = {
  period?: string
  limit?: number
  offset?: number
}

export const getTrendingProductsStepId = "get-trending-products"

export const getTrendingProductsStep = createStep(
  getTrendingProductsStepId,
  async (input: GetTrendingProductsStepInput, { container }) => {
    const provider = new RuleBasedRecommendationProvider()
    const result = await provider.getRecommendations(
      {
        type: "TRENDING",
        period: input.period,
        limit: input.limit,
        offset: input.offset,
      },
      container
    )

    return new StepResponse(result)
  }
)
