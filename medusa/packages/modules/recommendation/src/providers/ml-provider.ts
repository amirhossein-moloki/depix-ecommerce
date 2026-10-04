import { Modules } from "@medusajs/framework/utils"
import {
  RecommendationContext,
  RecommendationProvider,
  RecommendationResult,
  ScoredProduct,
} from "./recommendation-provider"
import { RuleBasedRecommendationProvider } from "./rule-based-provider"

export class MLRecommendationProvider implements RecommendationProvider {
  private ruleBasedFallbackProvider: RuleBasedRecommendationProvider
  private inferenceTimeoutMs: number
  private defaultLimit: number
  private maxLimit: number

  constructor() {
    this.ruleBasedFallbackProvider = new RuleBasedRecommendationProvider()
    this.inferenceTimeoutMs =
      Number(process.env.ML_INFERENCE_TIMEOUT_MS) || 2000
    this.defaultLimit = Number(process.env.RECOMMENDATION_DEFAULT_LIMIT) || 10
    this.maxLimit = Number(process.env.RECOMMENDATION_MAX_LIMIT) || 50
  }

  async getRecommendations(
    context: RecommendationContext,
    container: any
  ): Promise<RecommendationResult> {
    const isMlEnabled = process.env.ML_RECOMMENDATIONS_ENABLED !== "false"

    if (!isMlEnabled) {
      return await this.fallbackToRuleBased(
        context,
        container,
        "ML_DISABLED_FALLBACK"
      )
    }

    try {
      const inferencePromise = this.executeInference(context, container)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("ML recommendation inference timed out")),
          this.inferenceTimeoutMs
        )
      })

      return await Promise.race([inferencePromise, timeoutPromise])
    } catch (err: any) {
      console.error("MLRecommendationProvider error:", err?.message || err)
      return await this.fallbackToRuleBased(
        context,
        container,
        "ML_FAILURE_FALLBACK"
      )
    }
  }

  private async executeInference(
    context: RecommendationContext,
    container: any
  ): Promise<RecommendationResult> {
    const limit = Math.min(
      Math.max(context.limit ?? this.defaultLimit, 1),
      this.maxLimit
    )
    const offset = Math.max(context.offset ?? 0, 0)

    // Load active ML Model from RecommendationModuleService
    let activeModel: any = null
    try {
      if (
        container &&
        container.hasRegistration &&
        container.hasRegistration(Modules.RECOMMENDATION)
      ) {
        const recService = container.resolve(Modules.RECOMMENDATION)
        if (typeof recService.getActiveModel === "function") {
          activeModel = await recService.getActiveModel()
        } else if (typeof recService.listAndCountRecommendationModels === "function") {
          const [models] = await recService.listAndCountRecommendationModels({
            is_active: true,
            status: "ACTIVE",
          })
          if (models.length > 0) activeModel = models[0]
        }
      }
    } catch {
      activeModel = null
    }

    if (!activeModel || !activeModel.artifact_data) {
      return await this.fallbackToRuleBased(
        context,
        container,
        "NO_ACTIVE_ML_MODEL_FALLBACK"
      )
    }

    const artifact = activeModel.artifact_data || {}
    const similarityMatrix: Record<string, Record<string, number>> =
      artifact.similarity_matrix || {}
    const globalPopularityScores: Record<string, number> =
      artifact.global_scores || {}

    const productService = container.resolve(Modules.PRODUCT)
    if (!productService) {
      return await this.fallbackToRuleBased(
        context,
        container,
        "PRODUCT_SERVICE_UNAVAILABLE"
      )
    }

    const targetId = context.productId
    const customerId = context.customerId

    let candidateScores: Map<string, { score: number; reasons: string[] }> =
      new Map()

    // 1. Cold start / Strategy branch logic
    if (targetId && similarityMatrix[targetId]) {
      // Product similarity inference
      const simMap = similarityMatrix[targetId]
      for (const [candId, score] of Object.entries(simMap)) {
        candidateScores.set(candId, {
          score,
          reasons: [
            `Item-item ML collaborative similarity with product ${targetId} (Model ${activeModel.version})`,
          ],
        })
      }
    } else if (customerId && artifact.user_vectors?.[customerId]) {
      // Personalized customer inference from user latent profile
      const userSimMap = artifact.user_vectors[customerId]
      for (const [candId, score] of Object.entries(userSimMap)) {
        candidateScores.set(candId, {
          score: score as number,
          reasons: [
            `Personalized ML recommendation profile for customer (Model ${activeModel.version})`,
          ],
        })
      }
    } else if (Object.keys(globalPopularityScores).length > 0) {
      // Popularity weighted ML candidate scores
      for (const [candId, score] of Object.entries(globalPopularityScores)) {
        candidateScores.set(candId, {
          score,
          reasons: [
            `Global ML interaction score (Model ${activeModel.version})`,
          ],
        })
      }
    }

    if (candidateScores.size === 0) {
      return await this.fallbackToRuleBased(
        context,
        container,
        "ML_SPARSE_DATA_FALLBACK"
      )
    }

    // Candidate Generation & Querying published products
    const candidateIds = Array.from(candidateScores.keys())
    const filters: any = {
      id: candidateIds,
      status: "published",
    }

    const [publishedProducts] = await productService.listAndCountProducts(
      filters,
      { relations: ["variants", "categories", "collection", "tags"] }
    )

    if (!publishedProducts || publishedProducts.length === 0) {
      return await this.fallbackToRuleBased(
        context,
        container,
        "ML_NO_PUBLISHED_CANDIDATES_FALLBACK"
      )
    }

    const scoredProducts: ScoredProduct[] = []
    const excludeSet = new Set<string>()
    if (targetId) excludeSet.add(targetId)
    if (context.excludeProductIds) {
      context.excludeProductIds.forEach((id) => excludeSet.add(id))
    }

    for (const p of publishedProducts) {
      if (excludeSet.has(p.id)) continue
      const candInfo = candidateScores.get(p.id) || {
        score: 0,
        reasons: ["ML candidate default score"],
      }
      scoredProducts.push({
        product: p,
        score: candInfo.score,
        reasons: candInfo.reasons,
        strategy: `ML_${activeModel.version || "V1"}`,
      })
    }

    // Deterministic sorting (Primary: score DESC, Secondary: created_at DESC, Tertiary: ID ASC)
    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const dateA = new Date(a.product.created_at || 0).getTime()
      const dateB = new Date(b.product.created_at || 0).getTime()
      if (dateB !== dateA) return dateB - dateA
      return String(a.product.id).localeCompare(String(b.product.id))
    })

    if (scoredProducts.length === 0) {
      return await this.fallbackToRuleBased(
        context,
        container,
        "ML_ZERO_ELIGIBLE_RESULTS_FALLBACK"
      )
    }

    const totalCount = scoredProducts.length
    const pagedScored = scoredProducts.slice(offset, offset + limit)

    const explanationLabel = this.getExplanationLabel(context)

    const products = pagedScored.map((sp) => ({
      ...sp.product,
      recommendation_score: sp.score,
      recommendation_reasons: sp.reasons,
      recommendation_explanation: explanationLabel,
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
      strategy_used: `ML_MODEL_${activeModel.version || "V1"}`,
      fallback_applied: false,
      debug_scores: debugScores,
    }
  }

  private getExplanationLabel(context: RecommendationContext): string {
    if (context.customerId) {
      return "Based on your previous interactions & order history"
    }
    if (context.productId) {
      return "Similar to products you viewed"
    }
    if (context.contextType === "CART") {
      return "Frequently bought together"
    }
    return "Popular in this catalog"
  }

  private async fallbackToRuleBased(
    context: RecommendationContext,
    container: any,
    fallbackReason: string
  ): Promise<RecommendationResult> {
    const ruleRes = await this.ruleBasedFallbackProvider.getRecommendations(
      context,
      container
    )
    return {
      ...ruleRes,
      strategy_used: `ML_FALLBACK_RULE_BASED_${fallbackReason}`,
      fallback_applied: true,
    }
  }
}
