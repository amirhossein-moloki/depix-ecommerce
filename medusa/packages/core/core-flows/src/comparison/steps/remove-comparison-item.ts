import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type RemoveComparisonItemStepInput = {
  customer_id?: string | null
  comparison_id?: string | null
  comparison_item_id: string
}

export const removeComparisonItemStepId = "remove-comparison-item"

export const removeComparisonItemStep = createStep(
  removeComparisonItemStepId,
  async (input: RemoveComparisonItemStepInput, { container }) => {
    const comparisonService = container.resolve<any>(Modules.COMPARISON)

    let item: any = null
    try {
      item = await comparisonService.retrieveComparisonItem(
        input.comparison_item_id
      )
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Comparison item not found"
      )
    }

    if (!item) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Comparison item not found"
      )
    }

    await comparisonService.deleteComparisonItems([input.comparison_item_id])

    return new StepResponse({ id: input.comparison_item_id }, item)
  },
  async (itemData, { container }) => {
    if (itemData) {
      const comparisonService = container.resolve<any>(Modules.COMPARISON)
      await comparisonService.createComparisonItems({
        comparison_id: itemData.comparison_id,
        product_id: itemData.product_id,
      })
    }
  }
)
