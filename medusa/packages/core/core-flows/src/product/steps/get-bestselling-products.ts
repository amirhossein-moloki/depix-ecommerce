import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type GetBestSellingProductsStepInput = {
  limit?: number
  offset?: number
  period?: string
}

export const getBestSellingProductsStepId = "get-bestselling-products"

export const getBestSellingProductsStep = createStep(
  getBestSellingProductsStepId,
  async (input: GetBestSellingProductsStepInput, { container }) => {
    const orderService = container.resolve<any>(Modules.ORDER)
    const productService = container.resolve<any>(Modules.PRODUCT)

    const limit = input.limit ?? 20
    const offset = input.offset ?? 0

    // Compute period timestamp cutoff
    let createdAfter: Date | undefined
    if (input.period) {
      const now = Date.now()
      if (input.period === "7d") {
        createdAfter = new Date(now - 7 * 24 * 60 * 60 * 1000)
      } else if (input.period === "30d") {
        createdAfter = new Date(now - 30 * 24 * 60 * 60 * 1000)
      } else if (input.period === "90d") {
        createdAfter = new Date(now - 90 * 24 * 60 * 60 * 1000)
      } else if (input.period === "1y") {
        createdAfter = new Date(now - 365 * 24 * 60 * 60 * 1000)
      }
    }

    // List valid orders with items
    const orderFilters: any = {
      status: { $ne: "canceled" },
    }
    if (createdAfter) {
      orderFilters.created_at = { $gte: createdAfter }
    }

    const [orders] = await orderService.listAndCountOrders(orderFilters, {
      relations: ["items"],
      take: 1000,
    })

    // Aggregate sales quantity per product_id
    const productSalesMap: Record<string, number> = {}

    for (const order of orders) {
      for (const item of order.items || []) {
        const productId = item.product_id
        if (productId) {
          const qty = Number(item.quantity) || 0
          productSalesMap[productId] = (productSalesMap[productId] || 0) + qty
        }
      }
    }

    // Sort product IDs by sales quantity descending
    const sortedProductIds = Object.keys(productSalesMap).sort(
      (a, b) => productSalesMap[b] - productSalesMap[a]
    )

    const totalCount = sortedProductIds.length
    const pagedIds = sortedProductIds.slice(offset, offset + limit)

    let products: any[] = []
    if (pagedIds.length) {
      const [fetchedProducts] = await productService.listAndCountProducts(
        {
          id: pagedIds,
          status: "published",
        },
        {
          relations: ["variants", "categories", "collection", "tags"],
        }
      )

      // Maintain ranking order
      const productMap = new Map<string, any>(fetchedProducts.map((p: any) => [p.id, p]))
      products = pagedIds
        .map((id) => productMap.get(id))
        .filter((p): p is any => Boolean(p))
        .map((p: any) => ({
          ...p,
          sales_quantity: productSalesMap[p.id] || 0,
        }))
    }

    return new StepResponse({
      products,
      count: totalCount,
      limit,
      offset,
    })
  }
)
