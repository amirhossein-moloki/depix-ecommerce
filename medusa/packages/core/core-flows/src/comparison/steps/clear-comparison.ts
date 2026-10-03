import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ClearComparisonStepInput = {
  customer_id?: string | null
  comparison_id?: string | null
}

export const clearComparisonStepId = "clear-comparison"

export const clearComparisonStep = createStep(
  clearComparisonStepId,
  async (input: ClearComparisonStepInput, { container }) => {
    const comparisonService = container.resolve<any>(Modules.COMPARISON)

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

    if (!comparison || !comparison.items?.length) {
      return new StepResponse({ success: true, deletedCount: 0 })
    }

    const itemIds = comparison.items.map((i: any) => i.id)
    await comparisonService.deleteComparisonItems(itemIds)

    return new StepResponse(
      { success: true, deletedCount: itemIds.length },
      comparison.items
    )
  }
)
