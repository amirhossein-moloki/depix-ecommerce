import {
  RecommendationContext,
  RecommendationProvider,
  RecommendationResult,
  ScoredProduct,
} from "./recommendation-provider"
import { MLRecommendationProvider } from "./ml-provider"
import { RuleBasedRecommendationProvider } from "./rule-based-provider"

export class HybridRecommendationProvider implements RecommendationProvider {
  private mlProvider: MLRecommendationProvider
  private ruleProvider: RuleBasedRecommendationProvider
  private mlWeight: number
  private ruleWeight: number
  private defaultLimit: number
  private maxLimit: number

  constructor() {
    this.mlProvider = new MLRecommendationProvider()
    this.ruleProvider = new RuleBasedRecommendationProvider()
    this.mlWeight = Number(process.env.ML_HYBRID_ML_WEIGHT) || 0.6
    this.ruleWeight = Number(process.env.ML_HYBRID_RULE_WEIGHT) || 0.4
    this.defaultLimit = Number(process.env.RECOMMENDATION_DEFAULT_LIMIT) || 10
    this.maxLimit = Number(process.env.RECOMMENDATION_MAX_LIMIT) || 50
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

    // Execute ML and Rule-Based recommendation candidates concurrently
    const [mlResult, ruleResult] = await Promise.allSettled([
      this.mlProvider.getRecommendations({ ...context, limit: 100, offset: 0 }, container),
      this.ruleProvider.getRecommendations({ ...context, limit: 100, offset: 0 }, container),
    ])

    const mlRes = mlResult.status === "fulfilled" ? mlResult.value : null
    const ruleRes = ruleResult.status === "fulfilled" ? ruleResult.value : null

    // If ML fails completely or returned fallback, cleanly fall back to Rule-Based results
    if (!mlRes || mlRes.fallback_applied) {
      if (ruleRes) {
        return {
          ...ruleRes,
          strategy_used: "HYBRID_FALLBACK_RULE_BASED",
          fallback_applied: true,
        }
      }
    }

    if (!ruleRes && mlRes) {
      return mlRes
    }

    if (!mlRes && !ruleRes) {
      return {
        products: [],
        count: 0,
        limit,
        offset,
        strategy_used: "HYBRID_EMPTY",
        fallback_applied: true,
      }
    }

    const combinedMap = new Map<
      string,
      {
        product: any
        mlScore: number
        ruleScore: number
        reasons: string[]
      }
    >()

    // Process ML candidate scores
    const mlProducts = mlRes?.products || []
    let maxMlScore = 1
    for (const p of mlProducts) {
      const score = Number(p.recommendation_score) || 0
      if (score > maxMlScore) maxMlScore = score
    }

    for (const p of mlProducts) {
      const rawScore = Number(p.recommendation_score) || 0
      const normMl = maxMlScore > 0 ? (rawScore / maxMlScore) * 100 : 0
      combinedMap.set(p.id, {
        product: p,
        mlScore: normMl,
        ruleScore: 0,
        reasons: [`ML Score: ${normMl.toFixed(1)}`],
      })
    }

    // Process Rule candidate scores
    const ruleProducts = ruleRes?.products || []
    let maxRuleScore = 1
    for (const p of ruleProducts) {
      const score = Number(p.recommendation_score) || 0
      if (score > maxRuleScore) maxRuleScore = score
    }

    for (const p of ruleProducts) {
      const rawScore = Number(p.recommendation_score) || 0
      const normRule = maxRuleScore > 0 ? (rawScore / maxRuleScore) * 100 : 0

      if (combinedMap.has(p.id)) {
        const item = combinedMap.get(p.id)!
        item.ruleScore = normRule
        item.reasons.push(`Rule Score: ${normRule.toFixed(1)}`)
      } else {
        combinedMap.set(p.id, {
          product: p,
          mlScore: 0,
          ruleScore: normRule,
          reasons: [`Rule Score: ${normRule.toFixed(1)}`],
        })
      }
    }

    // Hybrid formula: final_score = ml_weight * ml_score + rule_weight * rule_score
    const scoredProducts: ScoredProduct[] = []
    const excludeSet = new Set<string>()
    if (context.productId) excludeSet.add(context.productId)
    if (context.excludeProductIds) {
      context.excludeProductIds.forEach((id) => excludeSet.add(id))
    }

    for (const [pid, entry] of combinedMap.entries()) {
      const p = entry.product

      // Mandatory business constraint checks
      if (!p || p.status !== "published" || excludeSet.has(pid)) {
        continue
      }

      const finalScore = Math.round(
        this.mlWeight * entry.mlScore + this.ruleWeight * entry.ruleScore
      )

      scoredProducts.push({
        product: p,
        score: finalScore,
        reasons: [
          `Hybrid Score (${finalScore}): ML weight ${this.mlWeight} * ${entry.mlScore.toFixed(
            1
          )} + Rule weight ${this.ruleWeight} * ${entry.ruleScore.toFixed(1)}`,
          ...entry.reasons,
        ],
        strategy: "HYBRID",
      })
    }

    // Deterministic tie-breaking sorting (Score DESC -> CreatedAt DESC -> ID ASC)
    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const dateA = new Date(a.product.created_at || 0).getTime()
      const dateB = new Date(b.product.created_at || 0).getTime()
      if (dateB !== dateA) return dateB - dateA
      return String(a.product.id).localeCompare(String(b.product.id))
    })

    const totalCount = scoredProducts.length
    const pagedScored = scoredProducts.slice(offset, offset + limit)

    const products = pagedScored.map((sp) => ({
      ...sp.product,
      recommendation_score: sp.score,
      recommendation_reasons: sp.reasons,
      recommendation_explanation: "Hybrid AI & Rule-based recommendation",
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
      strategy_used: "HYBRID_RECOMMENDATION",
      fallback_applied: false,
      debug_scores: debugScores,
    }
  }
}
