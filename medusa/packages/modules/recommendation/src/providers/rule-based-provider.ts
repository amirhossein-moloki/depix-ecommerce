import { Modules } from "@medusajs/framework/utils"
import {
  RecommendationContext,
  RecommendationProvider,
  RecommendationResult,
  ScoredProduct,
} from "./recommendation-provider"

export class RuleBasedRecommendationProvider implements RecommendationProvider {
  private defaultLimit: number
  private maxLimit: number
  private minCopurchaseCount: number

  constructor() {
    this.defaultLimit = Number(process.env.RECOMMENDATION_DEFAULT_LIMIT) || 10
    this.maxLimit = Number(process.env.RECOMMENDATION_MAX_LIMIT) || 50
    this.minCopurchaseCount =
      Number(process.env.RECOMMENDATION_MIN_COPURCHASE_COUNT) || 1
  }

  async getRecommendations(
    context: RecommendationContext,
    container: any
  ): Promise<RecommendationResult> {
    const limit = Math.min(
      Math.max(context.limit ?? this.defaultLimit, 1),
      this.maxLimit
    )
    const offset = Math.max(context.offset ?? 0, 0)
    const type = context.type

    if (type === "SIMILAR" && context.productId) {
      return await this.getSimilarProducts(context, container, limit, offset)
    }

    if (type === "RELATED" && context.productId) {
      return await this.getExplicitRelatedProducts(
        context,
        container,
        limit,
        offset
      )
    }

    if (type === "FREQUENTLY_BOUGHT_TOGETHER" && context.productId) {
      return await this.getFrequentlyBoughtTogether(
        context,
        container,
        limit,
        offset
      )
    }

    if (type === "POPULAR") {
      return await this.getPopularProducts(context, container, limit, offset)
    }

    if (type === "TRENDING") {
      return await this.getTrendingProducts(context, container, limit, offset)
    }

    if (
      type === "CUSTOMER_AWARE" ||
      context.customerId ||
      context.cartId ||
      context.contextType
    ) {
      return await this.getCustomerAwareRecommendations(
        context,
        container,
        limit,
        offset
      )
    }

    // Default fallback hierarchy
    return await this.executeFallbackHierarchy(
      context,
      container,
      limit,
      offset,
      "DEFAULT_FALLBACK"
    )
  }

  // 1. Similar Products Strategy
  private resolveService(container: any, key: string): any {
    try {
      if (container && typeof container.resolve === "function") {
        return container.resolve(key)
      }
    } catch {
      return null
    }
    return null
  }

  async getSimilarProducts(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number
  ): Promise<RecommendationResult> {
    const productService = this.resolveService(container, Modules.PRODUCT)
    if (!productService) {
      return this.formatResult([], limit, offset, "SIMILAR_PRODUCTS", false)
    }
    const targetId = context.productId!

    let targetProduct: any = null
    try {
      targetProduct = await productService.retrieveProduct(targetId, {
        relations: ["categories", "collection", "tags", "type", "variants"],
      })
    } catch {
      return await this.getPopularProducts(
        context,
        container,
        limit,
        offset,
        "POPULAR_FALLBACK_NOT_FOUND"
      )
    }

    const categoryIds = (targetProduct.categories || []).map((c: any) => c.id)
    const collectionId =
      targetProduct.collection_id || targetProduct.collection?.id
    const typeId = targetProduct.type_id || targetProduct.type?.id
    const tagIds = (targetProduct.tags || []).map((t: any) => t.id)
    const targetPrice = this.calculateAveragePrice(targetProduct)

    // Candidate generation
    const candidates = await this.generateCandidatesForSimilar(
      productService,
      targetId,
      categoryIds,
      collectionId,
      context.excludeProductIds
    )

    const scoredProducts: ScoredProduct[] = candidates.map((p: any) => {
      let score = 0
      const reasons: string[] = []

      const pCatIds = (p.categories || []).map((c: any) => c.id)
      const pColId = p.collection_id || p.collection?.id
      const pTypeId = p.type_id || p.type?.id
      const pTagIds = (p.tags || []).map((t: any) => t.id)

      // Category match (+40)
      let catMatchCount = 0
      for (const catId of categoryIds) {
        if (pCatIds.includes(catId)) catMatchCount++
      }
      if (catMatchCount > 0) {
        score += 40
        reasons.push(`Same category (+40)`)
      }

      // Collection match (+20)
      if (collectionId && pColId === collectionId) {
        score += 20
        reasons.push(`Same collection (+20)`)
      }

      // Attribute / Type match (+20)
      if (typeId && pTypeId === typeId) {
        score += 20
        reasons.push(`Same type/attribute (+20)`)
      }

      // Tag similarity (+10)
      let tagMatchCount = 0
      for (const tagId of tagIds) {
        if (pTagIds.includes(tagId)) tagMatchCount++
      }
      if (tagMatchCount > 0) {
        score += 10
        reasons.push(`Shared tags (+10)`)
      }

      // Price similarity (+10)
      if (targetPrice > 0) {
        const pPrice = this.calculateAveragePrice(p)
        if (pPrice > 0) {
          const diffRatio = Math.abs(pPrice - targetPrice) / targetPrice
          if (diffRatio <= 0.2) {
            score += 10
            reasons.push(`Similar price (+10)`)
          }
        }
      }

      return {
        product: p,
        score,
        reasons,
        strategy: "SIMILAR",
      }
    })

    const filteredAndSorted = this.filterAndSortScoredProducts(
      scoredProducts,
      targetId,
      context.excludeProductIds
    )

    if (filteredAndSorted.length >= offset + 1) {
      return this.formatResult(
        filteredAndSorted,
        limit,
        offset,
        "SIMILAR_PRODUCTS",
        false
      )
    }

    // Fallback to Category/Global Popular
    return await this.executeFallbackHierarchy(
      context,
      container,
      limit,
      offset,
      "SIMILAR_FALLBACK",
      categoryIds
    )
  }

  // 2. Explicit Related Products Strategy
  async getExplicitRelatedProducts(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number
  ): Promise<RecommendationResult> {
    const recommendationService = this.resolveService(container, Modules.RECOMMENDATION)
    const productService = this.resolveService(container, Modules.PRODUCT)
    if (!productService) {
      return this.formatResult([], limit, offset, "EXPLICIT_RELATED", false)
    }
    const targetId = context.productId!

    let relationships: any[] = []
    try {
      const [rels] = await recommendationService.listAndCountProductRelationships(
        {
          source_product_id: targetId,
          is_active: true,
        }
      )
      relationships = rels
    } catch {
      relationships = []
    }

    if (relationships.length > 0) {
      const relatedProductIds = relationships.map((r: any) => r.related_product_id)
      const [products] = await productService.listAndCountProducts(
        {
          id: relatedProductIds,
          status: "published",
        },
        { relations: ["variants", "categories", "collection", "tags"] }
      )

      const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]))
      const scoredProducts: ScoredProduct[] = []

      for (const rel of relationships) {
        const p = productMap.get(rel.related_product_id)
        if (p) {
          const score = 100 + (rel.priority || 0)
          scoredProducts.push({
            product: p,
            score,
            reasons: [
              `Explicit relationship (${rel.relationship_type}) with priority ${rel.priority}`,
            ],
            strategy: "EXPLICIT_RELATED",
          })
        }
      }

      const filteredAndSorted = this.filterAndSortScoredProducts(
        scoredProducts,
        targetId,
        context.excludeProductIds
      )

      if (filteredAndSorted.length > 0) {
        return this.formatResult(
          filteredAndSorted,
          limit,
          offset,
          "EXPLICIT_RELATED",
          false
        )
      }
    }

    // Fallback to Similar Products
    return await this.getSimilarProducts(context, container, limit, offset)
  }

  // 3. Frequently Bought Together Strategy
  async getFrequentlyBoughtTogether(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number
  ): Promise<RecommendationResult> {
    const orderService = this.resolveService(container, Modules.ORDER)
    const productService = this.resolveService(container, Modules.PRODUCT)
    const targetId = context.productId!

    let orders: any[] = []
    if (orderService) {
      try {
        const [orderList] = await orderService.listAndCountOrders(
          { status: { $ne: "canceled" } },
          { relations: ["items"], take: 1000 }
        )
        orders = orderList
      } catch {
        orders = []
      }
    }

    // Find co-purchased products
    const coPurchaseCounts: Record<string, number> = {}
    let targetOrderCount = 0

    for (const order of orders) {
      const items = order.items || []
      const productIds: string[] = Array.from(
        new Set(items.map((i: any) => String(i.product_id)).filter(Boolean))
      )

      if (productIds.includes(targetId)) {
        targetOrderCount++
        for (const pid of productIds) {
          if (pid !== targetId) {
            coPurchaseCounts[pid] = (coPurchaseCounts[pid] || 0) + 1
          }
        }
      }
    }

    const eligiblePairs = Object.entries(coPurchaseCounts).filter(
      ([, count]) => count >= this.minCopurchaseCount
    )

    if (eligiblePairs.length > 0) {
      const coProductIds = eligiblePairs.map(([pid]) => pid)
      const [products] = await productService.listAndCountProducts(
        {
          id: coProductIds,
          status: "published",
        },
        { relations: ["variants", "categories", "collection", "tags"] }
      )

      const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]))
      const scoredProducts: ScoredProduct[] = []

      for (const [pid, count] of eligiblePairs) {
        const p = productMap.get(pid)
        if (p) {
          const relativeFrequency =
            targetOrderCount > 0 ? (count / targetOrderCount) * 100 : 0
          const score = Math.round(count * 20 + relativeFrequency)
          scoredProducts.push({
            product: p,
            score,
            reasons: [
              `Co-purchased in ${count} orders (${Math.round(
                relativeFrequency
              )}% frequency)`,
            ],
            strategy: "FREQUENTLY_BOUGHT_TOGETHER",
          })
        }
      }

      const filteredAndSorted = this.filterAndSortScoredProducts(
        scoredProducts,
        targetId,
        context.excludeProductIds
      )

      if (filteredAndSorted.length > 0) {
        return this.formatResult(
          filteredAndSorted,
          limit,
          offset,
          "FREQUENTLY_BOUGHT_TOGETHER",
          false
        )
      }
    }

    // Fallback to Similar Products
    return await this.getSimilarProducts(context, container, limit, offset)
  }

  // 4. Popular Products Strategy
  async getPopularProducts(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number,
    strategyName = "POPULAR_PRODUCTS"
  ): Promise<RecommendationResult> {
    const orderService = this.resolveService(container, Modules.ORDER)
    const productService = this.resolveService(container, Modules.PRODUCT)

    if (!productService) {
      return this.formatResult([], limit, offset, strategyName, false)
    }

    let orders: any[] = []
    if (orderService) {
      try {
        const [orderList] = await orderService.listAndCountOrders(
          { status: { $ne: "canceled" } },
          { relations: ["items"], take: 1000 }
        )
        orders = orderList
      } catch {
        orders = []
      }
    }

    const salesVolume: Record<string, number> = {}
    const orderFrequency: Record<string, number> = {}

    for (const order of orders) {
      for (const item of order.items || []) {
        const pid = item.product_id
        if (pid) {
          const qty = Number(item.quantity) || 0
          salesVolume[pid] = (salesVolume[pid] || 0) + qty
          orderFrequency[pid] = (orderFrequency[pid] || 0) + 1
        }
      }
    }

    // Attempt review service if present
    let reviewsByProduct: Record<string, { avgRating: number; count: number }> =
      {}
    try {
      if (container.hasRegistration && container.hasRegistration(Modules.REVIEW)) {
        const reviewService = container.resolve(Modules.REVIEW)
        const [reviews] = await reviewService.listAndCountProductReviews(
          {},
          { take: 1000 }
        )
        for (const rev of reviews) {
          const pid = rev.product_id
          if (pid) {
            if (!reviewsByProduct[pid]) {
              reviewsByProduct[pid] = { avgRating: 0, count: 0 }
            }
            reviewsByProduct[pid].count++
            reviewsByProduct[pid].avgRating += rev.rating || 0
          }
        }
        for (const pid of Object.keys(reviewsByProduct)) {
          if (reviewsByProduct[pid].count > 0) {
            reviewsByProduct[pid].avgRating =
              reviewsByProduct[pid].avgRating / reviewsByProduct[pid].count
          }
        }
      }
    } catch {
      reviewsByProduct = {}
    }

    // Fetch candidate published products
    const [products] = await productService.listAndCountProducts(
      { status: "published" },
      { relations: ["variants", "categories", "collection", "tags"], take: 200 }
    )

    const scoredProducts: ScoredProduct[] = products.map((p: any) => {
      const pid = p.id
      const totalQty = salesVolume[pid] || 0
      const totalOrders = orderFrequency[pid] || 0
      const revData = reviewsByProduct[pid] || { avgRating: 0, count: 0 }

      // Formula: Popularity Score = (completed_orders * 5) + (units_sold * 2) + (rating * count)
      const score = Math.round(
        totalOrders * 5 + totalQty * 2 + revData.avgRating * revData.count
      )
      const reasons = [
        `Sales units: ${totalQty}, Orders: ${totalOrders}, Rating: ${revData.avgRating.toFixed(
          1
        )} (${revData.count} reviews)`,
      ]

      return {
        product: p,
        score,
        reasons,
        strategy: "POPULAR",
      }
    })

    const filteredAndSorted = this.filterAndSortScoredProducts(
      scoredProducts,
      context.productId,
      context.excludeProductIds
    )

    return this.formatResult(
      filteredAndSorted,
      limit,
      offset,
      strategyName,
      false
    )
  }

  // 5. Trending Products Strategy
  async getTrendingProducts(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number
  ): Promise<RecommendationResult> {
    const orderService = this.resolveService(container, Modules.ORDER)
    const productService = this.resolveService(container, Modules.PRODUCT)

    if (!productService) {
      return this.formatResult([], limit, offset, "TRENDING_PRODUCTS", false)
    }

    const windowDays = Number(context.period?.replace("d", "")) || 7
    const now = Date.now()
    const recentCutoff = new Date(now - windowDays * 24 * 60 * 60 * 1000)
    const previousCutoff = new Date(
      now - 2 * windowDays * 24 * 60 * 60 * 1000
    )

    let orders: any[] = []
    if (orderService) {
      try {
        const [orderList] = await orderService.listAndCountOrders(
          {
            status: { $ne: "canceled" },
            created_at: { $gte: previousCutoff },
          },
          { relations: ["items"], take: 1000 }
        )
        orders = orderList
      } catch {
        orders = []
      }
    }

    const recentSales: Record<string, number> = {}
    const previousSales: Record<string, number> = {}

    for (const order of orders) {
      const orderDate = new Date(order.created_at).getTime()
      const isRecent = orderDate >= recentCutoff.getTime()

      for (const item of order.items || []) {
        const pid = item.product_id
        if (pid) {
          const qty = Number(item.quantity) || 0
          if (isRecent) {
            recentSales[pid] = (recentSales[pid] || 0) + qty
          } else {
            previousSales[pid] = (previousSales[pid] || 0) + qty
          }
        }
      }
    }

    const trendingPids = Object.keys(recentSales)

    if (trendingPids.length > 0) {
      const [products] = await productService.listAndCountProducts(
        {
          id: trendingPids,
          status: "published",
        },
        { relations: ["variants", "categories", "collection", "tags"] }
      )

      const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]))
      const scoredProducts: ScoredProduct[] = []

      for (const pid of trendingPids) {
        const p = productMap.get(pid)
        if (p) {
          const current = recentSales[pid] || 0
          const previous = previousSales[pid] || 0
          const growthDelta = current - previous
          const growthRatio = previous > 0 ? growthDelta / previous : current
          const score = Math.round(current * 10 + growthRatio * 50)

          scoredProducts.push({
            product: p,
            score,
            reasons: [
              `Recent ${windowDays}d sales: ${current}, previous period: ${previous} (Growth: ${growthDelta >= 0 ? "+" : ""}${growthDelta})`,
            ],
            strategy: "TRENDING",
          })
        }
      }

      const filteredAndSorted = this.filterAndSortScoredProducts(
        scoredProducts,
        context.productId,
        context.excludeProductIds
      )

      if (filteredAndSorted.length > 0) {
        return this.formatResult(
          filteredAndSorted,
          limit,
          offset,
          "TRENDING_PRODUCTS",
          false
        )
      }
    }

    // Fallback if insufficient historical data
    return await this.getPopularProducts(
      context,
      container,
      limit,
      offset,
      "TRENDING_FALLBACK_POPULAR"
    )
  }

  // 6. Customer-Aware Recommendations Strategy
  async getCustomerAwareRecommendations(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number
  ): Promise<RecommendationResult> {
    const preferredCategoryIds = new Set<string>()
    const purchasedProductIds = new Set<string>()

    // Customer wishlist context
    if (context.customerId && container.hasRegistration && container.hasRegistration(Modules.WISHLIST)) {
      try {
        const wishlistService = container.resolve(Modules.WISHLIST)
        const [wishlists] = await wishlistService.listAndCountWishlists(
          { customer_id: context.customerId },
          { relations: ["items"] }
        )
        if (wishlists.length > 0 && wishlists[0].items?.length > 0) {
          const wProductIds = wishlists[0].items.map((i: any) => i.product_id)
          const productService = container.resolve(Modules.PRODUCT)
          const [wProducts] = await productService.listAndCountProducts(
            { id: wProductIds },
            { relations: ["categories"] }
          )
          for (const wp of wProducts) {
            for (const cat of wp.categories || []) {
              preferredCategoryIds.add(cat.id)
            }
          }
        }
      } catch {
        // Continue cleanly if wishlist query fails
      }
    }

    // Customer purchase history context
    if (context.customerId) {
      try {
        const orderService = container.resolve(Modules.ORDER)
        const [customerOrders] = await orderService.listAndCountOrders(
          {
            customer_id: context.customerId,
            status: { $ne: "canceled" },
          },
          { relations: ["items"], take: 50 }
        )
        for (const ord of customerOrders) {
          for (const item of ord.items || []) {
            if (item.product_id) {
              purchasedProductIds.add(item.product_id)
            }
          }
        }
      } catch {
        // Continue cleanly
      }
    }

    // Current Cart context
    if (context.cartId) {
      try {
        const cartService = container.resolve(Modules.CART)
        const cart = await cartService.retrieveCart(context.cartId, {
          relations: ["items"],
        })
        for (const item of cart.items || []) {
          if (item.product_id) {
            purchasedProductIds.add(item.product_id)
          }
        }
      } catch {
        // Continue cleanly
      }
    }

    // Get candidate popular products and apply customer boosting
    const popularRes = await this.getPopularProducts(
      context,
      container,
      100,
      0
    )
    const scoredProducts: ScoredProduct[] = popularRes.products.map((p: any) => {
      let score = 50
      const reasons: string[] = []

      const pCatIds = (p.categories || []).map((c: any) => c.id)

      // Category match with customer preferences (+30)
      for (const catId of pCatIds) {
        if (preferredCategoryIds.has(catId)) {
          score += 30
          reasons.push(`Matches customer preferred category (+30)`)
          break
        }
      }

      // Avoid re-recommending recently purchased products unless no other candidates
      if (purchasedProductIds.has(p.id)) {
        score -= 20
        reasons.push(`Previously purchased (-20)`)
      }

      return {
        product: p,
        score,
        reasons,
        strategy: "CUSTOMER_AWARE",
      }
    })

    const filteredAndSorted = this.filterAndSortScoredProducts(
      scoredProducts,
      context.productId,
      context.excludeProductIds
    )

    if (filteredAndSorted.length > 0) {
      return this.formatResult(
        filteredAndSorted,
        limit,
        offset,
        "CUSTOMER_AWARE",
        false
      )
    }

    return await this.getPopularProducts(
      context,
      container,
      limit,
      offset,
      "CUSTOMER_AWARE_FALLBACK_POPULAR"
    )
  }

  // Fallback Strategy Hierarchy Execution
  private async executeFallbackHierarchy(
    context: RecommendationContext,
    container: any,
    limit: number,
    offset: number,
    fallbackReason: string,
    categoryIds?: string[]
  ): Promise<RecommendationResult> {
    const productService = container.resolve(Modules.PRODUCT)

    // Fallback 1: Popular products in same category
    if (categoryIds && categoryIds.length > 0) {
      try {
        const [catProducts] = await productService.listAndCountProducts(
          {
            categories: { id: categoryIds },
            status: "published",
            id: { $ne: context.productId },
          },
          { relations: ["variants", "categories", "collection", "tags"], take: 50 }
        )

        if (catProducts.length > 0) {
          const scoredProducts: ScoredProduct[] = catProducts.map((p: any) => ({
            product: p,
            score: 30,
            reasons: [`Category popular fallback (${fallbackReason})`],
            strategy: "CATEGORY_POPULAR_FALLBACK",
          }))

          const filteredAndSorted = this.filterAndSortScoredProducts(
            scoredProducts,
            context.productId,
            context.excludeProductIds
          )

          if (filteredAndSorted.length > 0) {
            return this.formatResult(
              filteredAndSorted,
              limit,
              offset,
              `FALLBACK_${fallbackReason}_CATEGORY`,
              true
            )
          }
        }
      } catch {
        // Fallthrough to global popular
      }
    }

    // Fallback 2: Global popular products
    return await this.getPopularProducts(
      context,
      container,
      limit,
      offset,
      `FALLBACK_${fallbackReason}_GLOBAL`
    )
  }

  // Candidate Generation Helper
  private async generateCandidatesForSimilar(
    productService: any,
    targetId: string,
    categoryIds: string[],
    collectionId?: string,
    excludeProductIds?: string[]
  ): Promise<any[]> {
    const filters: any = {
      status: "published",
      id: { $ne: targetId },
    }

    if (excludeProductIds && excludeProductIds.length > 0) {
      filters.id = { $nin: [targetId, ...excludeProductIds] }
    }

    const [publishedProducts] = await productService.listAndCountProducts(
      filters,
      {
        relations: ["variants", "categories", "collection", "tags", "type"],
        take: 150,
      }
    )

    return publishedProducts
  }

  // Filter, Deduplicate, and Deterministically Tie-Break Scored Products
  private filterAndSortScoredProducts(
    scoredProducts: ScoredProduct[],
    excludeProductId?: string,
    excludeProductIds?: string[]
  ): ScoredProduct[] {
    const excludeSet = new Set<string>()
    if (excludeProductId) excludeSet.add(excludeProductId)
    if (excludeProductIds) {
      excludeProductIds.forEach((id) => excludeSet.add(id))
    }

    // Filter out ineligible / unpublished / excluded products
    const eligible = scoredProducts.filter((sp) => {
      if (!sp.product || !sp.product.id) return false
      if (sp.product.status && sp.product.status !== "published") return false
      if (excludeSet.has(sp.product.id)) return false
      return true
    })

    // Deduplicate by product ID
    const uniqueMap = new Map<string, ScoredProduct>()
    for (const sp of eligible) {
      const pid = sp.product.id
      if (!uniqueMap.has(pid) || uniqueMap.get(pid)!.score < sp.score) {
        uniqueMap.set(pid, sp)
      }
    }

    const deduplicated = Array.from(uniqueMap.values())

    // Deterministic Sorting: Primary score DESC, secondary created_at DESC, tertiary ID ASC
    deduplicated.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score

      const dateA = new Date(a.product.created_at || 0).getTime()
      const dateB = new Date(b.product.created_at || 0).getTime()
      if (dateB !== dateA) return dateB - dateA

      return String(a.product.id).localeCompare(String(b.product.id))
    })

    return deduplicated
  }

  private calculateAveragePrice(product: any): number {
    const variants = product.variants || []
    if (!variants.length) return 0
    let total = 0
    let count = 0
    for (const v of variants) {
      const prices = v.calculated_price?.calculated_amount || v.prices || []
      if (typeof prices === "number") {
        total += prices
        count++
      } else if (Array.isArray(prices) && prices.length > 0) {
        const amt = Number(prices[0].amount) || 0
        total += amt
        count++
      }
    }
    return count > 0 ? total / count : 0
  }

  private formatResult(
    scoredProducts: ScoredProduct[],
    limit: number,
    offset: number,
    strategyUsed: string,
    fallbackApplied: boolean
  ): RecommendationResult {
    const totalCount = scoredProducts.length
    const pagedScored = scoredProducts.slice(offset, offset + limit)

    const products = pagedScored.map((sp) => ({
      ...sp.product,
      recommendation_score: sp.score,
      recommendation_reasons: sp.reasons,
    }))

    const debugScores: Record<string, { score: number; reasons: string[] }> = {}
    for (const sp of pagedScored) {
      debugScores[sp.product.id] = {
        score: sp.score,
        reasons: sp.reasons,
      }
    }

    return {
      products,
      count: totalCount,
      limit,
      offset,
      strategy_used: strategyUsed,
      fallback_applied: fallbackApplied,
      debug_scores: debugScores,
    }
  }
}
