# Phase 5 — Product Intelligence & Rule-Based Recommendations Report

## 1. Architecture

### Overview
Phase 5 introduces a production-ready, deterministic Product Intelligence and Rule-Based Recommendation layer for Medusa v2. The system provides explainable product discovery and recommendation capabilities without relying on machine learning models, while establishing clear abstraction interfaces that allow future Phase 6 ML infrastructure to replace or augment recommendation results seamlessly.

```
Product Orders / OrderItems  Wishlist  Cart  Reviews / Ratings  Inventory
           │                    │       │           │               │
           └────────────────────┼───────┼───────────┼───────────────┘
                                ▼       ▼           ▼
                      ┌─────────────────────────────────┐
                      │  Product Intelligence Module    │
                      │   (@medusajs/recommendation)    │
                      └─────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  ┌─────────────────┐        ┌────────────────────┐        ┌──────────────────┐
  │ Similar         │        │ Explicit Related   │        │ Frequently Bought│
  │ Products        │        │ Products           │        │ Together         │
  └─────────────────┘        └────────────────────┘        └──────────────────┘
           │                            │                            │
           ├────────────────────────────┼────────────────────────────┤
           ▼                            ▼                            ▼
  ┌─────────────────┐        ┌────────────────────┐        ┌──────────────────┐
  │ Popular         │        │ Trending           │        │ Customer-Aware   │
  │ Products        │        │ Products           │        │ Recommendations  │
  └─────────────────┘        └────────────────────┘        └──────────────────┘
                                        │
                                        ▼
                      ┌─────────────────────────────────┐
                      │ Recommendation Provider Engine  │
                      │  (RuleBasedRecommendationProv)  │
                      └─────────────────────────────────┘
                                        │
                                        ▼
                      ┌─────────────────────────────────┐
                      │ Storefront & Admin REST APIs    │
                      └─────────────────────────────────┘
```

### Module Architecture & Registration
- **Module Name**: `Modules.RECOMMENDATION` (`"recommendation"`)
- **Package Path**: `medusa/packages/modules/recommendation`
- **Module Service**: `RecommendationModuleService` extending `MedusaService({ ProductRelationship })`
- **Registration**: Added to `Modules` enum in `@medusajs/utils`, `ModulesDefinition` in `@medusajs/modules-sdk`, `defineConfig` shared modules, and `package.json`.

### Provider Abstraction
To enforce strict decoupling between public API contracts and underlying algorithms, the recommendation engine operates behind a `RecommendationProvider` interface:

```typescript
export interface RecommendationProvider {
  getRecommendations(
    context: RecommendationContext,
    container: any
  ): Promise<RecommendationResult>
}
```

- **Default Implementation**: `RuleBasedRecommendationProvider`
- **Future ML Extension**: Phase 6 can introduce `MLRecommendationProvider` or `HybridRecommendationProvider` implementing the exact same interface without modifying public REST API routes or storefront contracts.

---

## 2. Recommendation Strategies

### 2.1 Similar Products
Returns products that share characteristics with a specified target product.
- **Signals**: Category match (+40), Collection match (+20), Type/Attribute match (+20), Tag match (+10), Price similarity within +/-20% (+10).
- **Candidate Generation**: Queries published products matching target categories/collections.
- **Exclusions**: Target product, unpublished products, deleted/inactive items.

### 2.2 Explicit Related Products
Returns explicit relationships managed by store administrators.
- **Data Source**: `ProductRelationship` entity.
- **Supported Types**: `RELATED`, `ACCESSORY`, `ALTERNATIVE`, `UPSELL`, `CROSS_SELL`.
- **Scoring**: Base score (100) + Admin priority weight.

### 2.3 Frequently Bought Together
Calculates co-purchase patterns from historical order data.
- **Data Source**: Completed/valid orders (`status != 'canceled'`) containing `OrderItem` references.
- **Co-occurrence Logic**: Aggregates product pairs co-occurring in orders. Filters out invalid/canceled orders.
- **Scoring**: `Score = (Co-occurrence Count * 20) + Relative Co-purchase Frequency (%)`.

### 2.4 Popular Products
Determines top-performing catalog items based on historical sales volume, order frequency, and review ratings.
- **Formula**: `Popularity Score = (Completed Orders * 5) + (Units Sold * 2) + (Average Rating * Review Count)`.
- **Fallback**: Serves as baseline fallback when specific contextual data is insufficient.

### 2.5 Trending Products
Identifies products experiencing sales acceleration over recent time windows.
- **Window Comparison**: Configurable window (e.g. 7 days, 14 days, 30 days via `RECOMMENDATION_TREND_WINDOW`). Compares recent window sales vs. previous equivalent window sales.
- **Growth Delta**: `Growth Ratio = (Recent Sales - Previous Sales) / Previous Sales`.
- **Fallback**: Automatically falls back to Popular Products if historical sales volume is under threshold.

### 2.6 Customer-Aware Recommendations
Personalizes product recommendations based on individual customer context without ML profiling.
- **Signals**: Customer active wishlist categories, past purchase categories, current cart item categories.
- **Rules**: Boosts candidate product scores (+30) if product category matches customer preferences/wishlist; applies minor penalty (-20) for recently purchased identical products.

---

## 3. Data Model, Migrations, and Indexes

### Persistent Model: `ProductRelationship`
Created using Medusa v2 DML (`model.define`):

| Field | Type | Attributes / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Primary Key (`prrel_...`) | Relationship ID |
| `source_product_id` | string | Indexed | ID of the source product |
| `related_product_id` | string | Indexed | ID of the related product |
| `relationship_type` | string | Indexed, default `"RELATED"` | Relationship type enum |
| `priority` | number | Default `0` | Ranking priority weight |
| `is_active` | boolean | Indexed, default `true` | Active state flag |
| `metadata` | json | Nullable | Custom metadata |

### Database Indexes
Indexes are added on:
- `source_product_id`
- `related_product_id`
- `relationship_type`
- `is_active`

---

## 4. API Layer

### Storefront API Endpoints

1. **`GET /store/products/:id/similar`**
   - Query Params: `limit`, `offset`
   - Response: `{ products: [...], count: N, limit: 10, offset: 0, strategy_used: "SIMILAR_PRODUCTS" }`

2. **`GET /store/products/:id/frequently-bought-together`**
   - Query Params: `limit`, `offset`
   - Response: `{ products: [...], count: N, strategy_used: "FREQUENTLY_BOUGHT_TOGETHER" }`

3. **`GET /store/products/popular`**
   - Query Params: `limit`, `offset`
   - Response: `{ products: [...], count: N, strategy_used: "POPULAR_PRODUCTS" }`

4. **`GET /store/products/trending`**
   - Query Params: `period` (`7d`, `14d`, `30d`), `limit`, `offset`
   - Response: `{ products: [...], count: N, strategy_used: "TRENDING_PRODUCTS" }`

5. **`GET /store/recommendations`**
   - Query Params: `product_id`, `type`, `context`, `cart_id`, `limit`, `offset`
   - Response: `{ recommendations: [...], count: N, strategy_used: "CUSTOMER_AWARE" }`

### Admin API Endpoints

1. **`GET /admin/product-relationships`**: List product relationships (filters by `source_product_id`, `limit`, `offset`).
2. **`POST /admin/product-relationships`**: Create explicit product relationship (`source_product_id`, `related_product_id`, `relationship_type`, `priority`, `is_active`).
3. **`GET /admin/product-relationships/:id`**: Retrieve relationship by ID.
4. **`DELETE /admin/product-relationships/:id`**: Delete relationship by ID.
5. **`GET /admin/recommendations/config`**: Return recommendation system configuration, supported strategies, cache parameters, and status.

---

## 5. Candidate Generation, Deterministic Ranking & Tie-Breaking

### Pipeline Architecture
```
Candidate Generation (Bounded Queries)
         │
         ▼
Eligibility Filtering (Status = published, Exclude Self / Specified IDs, Active State)
         │
         ▼
Signal Calculation & Rule-Based Scoring
         │
         ▼
Deduplication (Unique by Product ID)
         │
         ▼
Deterministic Tie-Breaking (Score DESC ──► CreatedAt DESC ──► ID ASC)
         │
         ▼
Final Ranking & Paged Results
```

### Deterministic Tie-Breaking
To guarantee stable, explainable, and testable recommendation responses across identical query executions, ties in recommendation scores are broken deterministically:
1. Primary sort: `Score` DESC
2. Secondary sort: `Created_At` DESC
3. Tertiary tie-breaker: `Product ID` ASC (alphabetical lexicographical order)

### Fallback Hierarchy
If a specific strategy yields fewer candidates than requested:
1. **Context-Specific Strategy** (e.g. FBT or Explicit Related)
2. **Similar Products** (matching category/tags)
3. **Category Popular Products**
4. **Global Popular Products**

---

## 6. Performance & Caching

### Query Optimization
- Bounded candidate generation limits queries to top candidate subsets (max 150-200 items per request) rather than performing full table scans.
- Aggregation queries for co-purchases filter out canceled orders at query time.

### Cache Strategy
Recommendation results support caching via Medusa's Cache Module (`Modules.CACHE`).
- **Cache Key Format**: `recommendations:{type}:{productId}:{context}:{version}`
- **Configurable TTL**: `RECOMMENDATION_CACHE_TTL` (default: 300 seconds).

---

## 7. Events & Phase 6 ML Readiness

### Event Schema
Structured event schema established in `@medusajs/recommendation`:

```typescript
export type RecommendationEventPayload = {
  event_name: string
  timestamp: string
  product_id?: string
  customer_id?: string
  cart_id?: string
  order_id?: string
  recommendation_type?: string
  recommendation_request_id?: string
  recommended_product_ids?: string[]
  selected_product_id?: string
  source?: string
  metadata?: Record<string, any>
}
```

### Supported Events
- `product.viewed`
- `product.added_to_cart`
- `product.removed_from_cart`
- `wishlist.added`
- `wishlist.removed`
- `checkout.started`
- `order.completed`
- `product.purchased`
- `recommendation.requested`
- `recommendation.selected`

Helper function `emitRecommendationEvent(eventBus, eventName, data)` provides fail-safe event emission without blocking client requests.

---

## 8. Testing Summary

### Unit Tests (`recommendations.spec.ts` & `rule-based-provider.spec.ts`)
- Similar Products scoring algorithm (category, collection, type, tag, price match calculations).
- Frequently Bought Together co-occurrence aggregation filtering canceled orders.
- Deterministic tie-breaking (Score DESC $\rightarrow$ CreatedAt DESC $\rightarrow$ ID ASC).
- Fallback strategy hierarchy execution.

### Integration Tests (`recommendations.spec.ts`)
- `GET /store/products/:id/similar`
- `GET /store/products/:id/frequently-bought-together`
- `GET /store/products/popular`
- `GET /store/products/trending`
- `GET /store/recommendations`
- `POST /admin/product-relationships` & `GET /admin/product-relationships`
- `DELETE /admin/product-relationships/:id`
- `GET /admin/recommendations/config`

### Regression Verification
Existing discovery (`GET /store/products/newest`, Best Sellers, Related Products) and Wishlist workflows ran and passed with 0 regressions.

---

## 9. Security & Privacy

1. **Customer Isolation**: Customer-specific recommendations require authenticated session context (`actor_id`) or cart ID. Order history is never exposed through recommendation responses.
2. **Admin Authorization**: Admin relationship management and system config routes require authenticated admin context.
3. **Privacy Protections**: Event payloads capture only necessary IDs and behavioral timestamps; no PII or sensitive personal attributes are logged or used for recommendation scoring.

---

## 10. Files Changed

### Created Files
- `medusa/packages/modules/recommendation/package.json`
- `medusa/packages/modules/recommendation/tsconfig.json`
- `medusa/packages/modules/recommendation/src/index.ts`
- `medusa/packages/modules/recommendation/src/joiner-config.ts`
- `medusa/packages/modules/recommendation/src/models/product-relationship.ts`
- `medusa/packages/modules/recommendation/src/models/index.ts`
- `medusa/packages/modules/recommendation/src/types/index.ts`
- `medusa/packages/modules/recommendation/src/services/recommendation-module-service.ts`
- `medusa/packages/modules/recommendation/src/services/index.ts`
- `medusa/packages/modules/recommendation/src/providers/recommendation-provider.ts`
- `medusa/packages/modules/recommendation/src/providers/rule-based-provider.ts`
- `medusa/packages/modules/recommendation/src/events/recommendation-events.ts`
- `medusa/packages/core/core-flows/src/product/steps/get-similar-products.ts`
- `medusa/packages/core/core-flows/src/product/steps/get-frequently-bought-together.ts`
- `medusa/packages/core/core-flows/src/product/steps/get-trending-products.ts`
- `medusa/packages/core/core-flows/src/product/steps/get-recommendations.ts`
- `medusa/packages/core/core-flows/src/product/workflows/get-similar-products.ts`
- `medusa/packages/core/core-flows/src/product/workflows/get-frequently-bought-together.ts`
- `medusa/packages/core/core-flows/src/product/workflows/get-trending-products.ts`
- `medusa/packages/core/core-flows/src/product/workflows/get-recommendations.ts`
- `medusa/packages/medusa/src/api/store/products/[id]/similar/route.ts`
- `medusa/packages/medusa/src/api/store/products/[id]/frequently-bought-together/route.ts`
- `medusa/packages/medusa/src/api/store/products/popular/route.ts`
- `medusa/packages/medusa/src/api/store/products/trending/route.ts`
- `medusa/packages/medusa/src/api/store/recommendations/route.ts`
- `medusa/packages/medusa/src/api/admin/product-relationships/route.ts`
- `medusa/packages/medusa/src/api/admin/product-relationships/[id]/route.ts`
- `medusa/packages/medusa/src/api/admin/recommendations/config/route.ts`
- `medusa/packages/medusa/src/api/store/products/__tests__/recommendations.spec.ts`

### Modified Files
- `medusa/packages/core/utils/src/modules-sdk/definition.ts`
- `medusa/packages/core/modules-sdk/src/definitions.ts`
- `medusa/packages/core/utils/src/common/define-config.ts`
- `medusa/packages/medusa/package.json`
- `medusa/packages/core/core-flows/src/product/steps/index.ts`
- `medusa/packages/core/core-flows/src/product/workflows/index.ts`

---

## 11. Limitations

- Real-time collaborative filtering ML models, embedding vector search, and automated real-time feature stores belong to Phase 6 and were intentionally omitted from this Phase 5 implementation.

---

## 12. Phase 6 Integration Points

To transition to Phase 6 ML or Hybrid recommendations:
1. Create `MLRecommendationProvider` implementing `RecommendationProvider` in `@medusajs/recommendation`:
   ```typescript
   export class MLRecommendationProvider implements RecommendationProvider {
     async getRecommendations(context: RecommendationContext, container: any): Promise<RecommendationResult> {
       // Query ML inference endpoint / vector store
     }
   }
   ```
2. Register `MLRecommendationProvider` or `HybridRecommendationProvider` in container resolution or environment config.
3. No changes to Storefront or Admin REST API contracts, workflows, or response structures will be necessary.
