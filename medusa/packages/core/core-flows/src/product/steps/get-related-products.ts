import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type GetRelatedProductsStepInput = {
  product_id: string
  limit?: number
  offset?: number
}

export const getRelatedProductsStepId = "get-related-products"

export const getRelatedProductsStep = createStep(
  getRelatedProductsStepId,
  async (input: GetRelatedProductsStepInput, { container }) => {
    const productService = container.resolve<any>(Modules.PRODUCT)

    const limit = input.limit ?? 10
    const offset = input.offset ?? 0

    let targetProduct: any = null
    try {
      targetProduct = await productService.retrieveProduct(input.product_id, {
        relations: ["categories", "collection", "tags", "type"],
      })
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${input.product_id} not found`
      )
    }

    const categoryIds = (targetProduct.categories || []).map((c: any) => c.id)
    const collectionId = targetProduct.collection_id || targetProduct.collection?.id
    const typeId = targetProduct.type_id || targetProduct.type?.id
    const tagIds = (targetProduct.tags || []).map((t: any) => t.id)

    // Build deterministic filter criteria prioritized: Category -> Collection -> Type -> Tags
    const [publishedProducts] = await productService.listAndCountProducts(
      {
        status: "published",
        id: { $ne: input.product_id },
      },
      {
        relations: ["variants", "categories", "collection", "tags", "type"],
        take: 100,
      }
    )

    // Rank candidate products by match score
    const scoredProducts = publishedProducts.map((p: any) => {
      let score = 0
      const pCatIds = (p.categories || []).map((c: any) => c.id)
      const pColId = p.collection_id || p.collection?.id
      const pTypeId = p.type_id || p.type?.id
      const pTagIds = (p.tags || []).map((t: any) => t.id)

      // Category match (highest priority: 10 pts per match)
      for (const catId of categoryIds) {
        if (pCatIds.includes(catId)) score += 10
      }

      // Collection match (5 pts)
      if (collectionId && pColId === collectionId) score += 5

      // Type match (3 pts)
      if (typeId && pTypeId === typeId) score += 3

      // Tag match (2 pts per match)
      for (const tagId of tagIds) {
        if (pTagIds.includes(tagId)) score += 2
      }

      return { product: p, score }
    })

    // Filter out 0-score matches if score > 0 matches exist, otherwise return published products deterministically
    let matching = scoredProducts.filter((sp: any) => sp.score > 0)
    if (!matching.length) {
      matching = scoredProducts
    }

    // Sort by score DESC, then created_at DESC
    matching.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score
      return (
        new Date(b.product.created_at).getTime() -
        new Date(a.product.created_at).getTime()
      )
    })

    const totalCount = matching.length
    const pagedProducts = matching
      .slice(offset, offset + limit)
      .map((sp: any) => sp.product)

    return new StepResponse({
      products: pagedProducts,
      count: totalCount,
      limit,
      offset,
    })
  }
)
