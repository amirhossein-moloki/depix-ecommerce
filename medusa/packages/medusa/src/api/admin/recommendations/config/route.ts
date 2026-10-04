import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const config = {
    provider: "RULE_BASED",
    supported_types: [
      "SIMILAR",
      "RELATED",
      "FREQUENTLY_BOUGHT_TOGETHER",
      "POPULAR",
      "TRENDING",
      "CUSTOMER_AWARE",
    ],
    supported_contexts: [
      "PRODUCT_PAGE",
      "CART",
      "CHECKOUT",
      "CUSTOMER_HOME",
      "WISHLIST",
    ],
    default_limit: Number(process.env.RECOMMENDATION_DEFAULT_LIMIT) || 10,
    max_limit: Number(process.env.RECOMMENDATION_MAX_LIMIT) || 50,
    cache_ttl_seconds: Number(process.env.RECOMMENDATION_CACHE_TTL) || 300,
    min_copurchase_count:
      Number(process.env.RECOMMENDATION_MIN_COPURCHASE_COUNT) || 1,
    fallback_hierarchy: [
      "Context-Specific Recommendations",
      "Similar / Related Products",
      "Category Popular Products",
      "Global Popular Products",
    ],
    ml_ready: true,
  }

  res.json({ config })
}
