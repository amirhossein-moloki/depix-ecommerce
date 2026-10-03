import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type AddComparisonItemStepInput = {
  customer_id?: string | null
  comparison_id?: string | null
  product_id: string
}

export const MAX_COMPARISON_ITEMS = 5
export const addComparisonItemStepId = "add-comparison-item"

export const addComparisonItemStep = createStep(
  addComparisonItemStepId,
  async (input: AddComparisonItemStepInput, { container }) => {
    const comparisonService = container.resolve<any>(Modules.COMPARISON)
    const productService = container.resolve<any>(Modules.PRODUCT)

    // 1. Verify product exists
    try {
      await productService.retrieveProduct(input.product_id)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${input.product_id} not found`
      )
    }

    // 2. Find or create comparison
    let comparison: any = null
    if (input.comparison_id) {
      try {
        comparison = await comparisonService.retrieveComparison(
          input.comparison_id,
          { relations: ["items"] }
        )
      } catch {
        // Fallback
      }
    }

    if (!comparison && input.customer_id) {
      const [comparisons] = await comparisonService.listAndCountComparisons(
        { customer_id: input.customer_id },
        { relations: ["items"] }
      )
      comparison = comparisons[0]
    }

    if (!comparison) {
      comparison = await comparisonService.createComparisons({
        customer_id: input.customer_id ?? null,
      })
      comparison.items = []
    }

    // 3. Duplicate protection
    const existingItem = (comparison.items || []).find(
      (item: any) => item.product_id === input.product_id
    )

    if (existingItem) {
      return new StepResponse(
        { item: existingItem, comparison },
        { createdId: null }
      )
    }

    // 4. Enforce comparison max limit
    if ((comparison.items || []).length >= MAX_COMPARISON_ITEMS) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Comparison limit exceeded. Maximum ${MAX_COMPARISON_ITEMS} products allowed.`
      )
    }

    // 5. Add comparison item
    const newItem = await comparisonService.createComparisonItems({
      comparison_id: comparison.id,
      product_id: input.product_id,
    })

    return new StepResponse(
      { item: newItem, comparison },
      { createdId: newItem.id }
    )
  },
  async (compensateData, { container }) => {
    if (compensateData?.createdId) {
      const comparisonService = container.resolve<any>(Modules.COMPARISON)
      await comparisonService.deleteComparisonItems([
        compensateData.createdId,
      ])
    }
  }
)
