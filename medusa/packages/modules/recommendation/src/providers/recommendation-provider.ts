export type RecommendationType =
  | "SIMILAR"
  | "RELATED"
  | "FREQUENTLY_BOUGHT_TOGETHER"
  | "POPULAR"
  | "TRENDING"
  | "CUSTOMER_AWARE"

export type RecommendationContextType =
  | "PRODUCT_PAGE"
  | "CART"
  | "CHECKOUT"
  | "CUSTOMER_HOME"
  | "WISHLIST"

export type RecommendationContext = {
  productId?: string
  customerId?: string
  cartId?: string
  type?: RecommendationType
  contextType?: RecommendationContextType
  limit?: number
  offset?: number
  period?: string
  excludeProductIds?: string[]
}

export type ScoredProduct = {
  product: any
  score: number
  reasons: string[]
  strategy: string
}

export type RecommendationResult = {
  products: any[]
  count: number
  limit: number
  offset: number
  strategy_used: string
  fallback_applied: boolean
  debug_scores?: Record<string, { score: number; reasons: string[] }>
}

export interface RecommendationProvider {
  getRecommendations(
    context: RecommendationContext,
    container: any
  ): Promise<RecommendationResult>
}
