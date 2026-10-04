import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RuleBasedRecommendationProvider } from "@medusajs/recommendation"

export type GetFrequentlyBoughtTogetherStepInput = {
  product_id: string
  limit?: number
  offset?: number
}

export const getFrequentlyBoughtTogetherStepId =
  "get-frequently-bought-together"

export const getFrequentlyBoughtTogetherStep = createStep(
  getFrequentlyBoughtTogetherStepId,
  async (input: GetFrequentlyBoughtTogetherStepInput, { container }) => {
    const provider = new RuleBasedRecommendationProvider()
    const result = await provider.getRecommendations(
      {
        productId: input.product_id,
        type: "FREQUENTLY_BOUGHT_TOGETHER",
        limit: input.limit,
        offset: input.offset,
      },
      container
    )

    return new StepResponse(result)
  }
)
