import { MAX_COMPARISON_ITEMS } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id || null
  const comparisonService = req.scope.resolve<any>(Modules.COMPARISON)
  const productService = req.scope.resolve<any>(Modules.PRODUCT)

  let comparison: any = null
  if (customerId) {
    const [comparisons] = await comparisonService.listAndCountComparisons(
      { customer_id: customerId },
      { relations: ["items"] }
    )
    comparison = comparisons[0]
  }

  if (!comparison) {
    comparison = { id: null, customer_id: customerId, items: [] }
  } else if (comparison.items?.length) {
    const productIds = comparison.items.map((i: any) => i.product_id)
    const [products] = await productService.listAndCountProducts(
      { id: productIds },
      {
        relations: [
          "variants",
          "categories",
          "collection",
          "type",
          "tags",
          "options",
        ],
      }
    )
    const productMap = new Map<string, any>(
      products.map((p: any) => [p.id, p])
    )

    comparison.items = comparison.items.map((item: any) => ({
      id: item.id,
      comparison_id: item.comparison_id,
      product_id: item.product_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: productMap.get(item.product_id) || null,
    }))
  }

  res.json({
    comparison: {
      ...comparison,
      max_items: MAX_COMPARISON_ITEMS,
    },
  })
}
