import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RuleBasedRecommendationProvider } from "@medusajs/recommendation"

export type GetSimilarProductsStepInput = {
  product_id: string
  limit?: number
  offset?: number
  exclude_product_ids?: string[]
}

export const getSimilarProductsStepId = "get-similar-products"

export const getSimilarProductsStep = createStep(
  getSimilarProductsStepId,
  async (input: GetSimilarProductsStepInput, { container }) => {
    const provider = new RuleBasedRecommendationProvider()
    const result = await provider.getRecommendations(
      {
        productId: input.product_id,
        type: "SIMILAR",
        limit: input.limit,
        offset: input.offset,
        excludeProductIds: input.exclude_product_ids,
      },
      container
    )

    return new StepResponse(result)
  }
)
