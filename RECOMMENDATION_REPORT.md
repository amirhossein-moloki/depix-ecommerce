# Phase 6 — ML-Based Recommendation System Report

## 1. Executive Summary & Architecture Overview
Phase 6 builds directly on Phase 5's recommendation engine, provider abstraction, and event infrastructure. It introduces a production-ready Machine Learning recommendation layer to the Medusa v2 backend without breaking existing REST API contracts or requiring storefront rewrite.

```
Customer / Anonymous Session
        │
        ▼
Recommendation API (`/store/recommendations`, `/store/products/:id/similar`, etc.)
        │
        ▼
Recommendation Workflow (`getRecommendationsWorkflow`)
        │
        ▼
Recommendation Step (`getRecommendationsStep`)
        │
        ▼
Provider Dispatcher (ML_PROVIDER: "RULE_BASED" | "ML" | "HYBRID")
        │
        ├──────────────────────────────┬──────────────────────────────┐
        ▼                              ▼                              ▼
RuleBasedRecommendationProvider   MLRecommendationProvider   HybridRecommendationProvider
(Category, Co-purchases,          (Implicit Matrix Fact.,     (Weighted Score:
 Popularity, Growth Delta)         Customer Profile Vectors,   0.6 * ML + 0.4 * Rule +
                                   Timeout & Error Fallback)   Business Constraint Filtering)
```

---

## 2. ML Provider Strategy & Model Lifecycle

### Providers
- **`MLRecommendationProvider`**: Executes inference using active ML model artifacts stored in the `RecommendationModel` registry. Integrates cold-start handling (falls back to popularity/category vectors), timeout guards (`ML_INFERENCE_TIMEOUT_MS`), user explanation labels, and automatic fallback to rule-based logic upon failure or sparse data.
- **`HybridRecommendationProvider`**: Combines normalized ML scores and Rule-Based scores using configurable weights:
  $$\text{Final Score} = (\text{ML Weight} \times \text{ML Score}) + (\text{Rule Weight} \times \text{Rule Score})$$
  Default weights: `ML_HYBRID_ML_WEIGHT=0.6`, `ML_HYBRID_RULE_WEIGHT=0.4`. Mandatory business constraint filters (published status, stock availability, category exclusions) are strictly enforced.

### Model Registry (`RecommendationModel`)
Persistent entity schema created using Medusa v2 DML:
- `id`: PK (`recmod_...`)
- `version`: Model version identifier (e.g. `v20260330_1000`)
- `algorithm`: Default `"implicit-collaborative-filtering"`
- `status`: State lifecycle (`TRAINING` | `VALIDATING` | `READY` | `ACTIVE` | `ARCHIVED` | `FAILED`)
- `is_active`: Boolean active flag
- `training_timestamp`, `data_range_start`, `data_range_end`
- `metrics`: Evaluation metrics (`precision_at_k`, `recall_at_k`, `hit_rate_at_k`, `catalog_coverage`)
- `artifact_data`: JSON matrix containing similarity matrices, global scores, and user vectors.

---

## 3. Training Pipeline & Interaction Weighting

### Pipeline Architecture (`OfflineTrainingPipeline`)
1. **Raw Event Extraction**: Ingests historical orders, carts, wishlists, and tracked `RecommendationEventPayload` events within `ML_TRAINING_LOOKBACK_DAYS` (default 90 days).
2. **Signal Weighting**:
   - Product View: `1`
   - Search: `1`
   - Wishlist Add: `3`
   - Cart Add: `5`
   - Purchase: `10`
3. **Temporal Splitting**: Applies time-aware train/validation splitting (e.g., 80% historical training, 20% validation window) to prevent future data leakage into historical training examples.
4. **Co-occurrence Matrix Computation**: Calculates item-item similarity vectors and user profile latent vectors.
5. **Offline Metric Calculation**: Evaluates $HitRate@K$, $Precision@K$, $Recall@K$, and Catalog $Coverage$.
6. **Artifact Persistence**: Stores matrix artifacts and marks model status as `READY`.

---

## 4. Admin & Storefront API Layer

### Admin Model Management Endpoints
- `GET /admin/recommendations/models`: List registered recommendation models and active model version.
- `POST /admin/recommendations/models/train`: Trigger background offline model training pipeline.
- `POST /admin/recommendations/models/:id/activate`: Activate target validated model and invalidate stale caches.
- `POST /admin/recommendations/models/:id/rollback`: Rollback to previously active model version.
- `GET /admin/recommendations/metrics`: Retrieve active model evaluation metrics, fallback rates, and status.

### Storefront Caching & Explanations
- **Version-Aware Redis Cache Keys**:
  `recommendation:{provider}:{type}:{customer_or_session}:{model_version}:{limit}:{offset}`
- **Explainable Labels**:
  - *"Based on your previous interactions & order history"*
  - *"Similar to products you viewed"*
  - *"Frequently bought together"*
  - *"Popular in this catalog"*

---

## 5. Environment & System Configuration

```env
ML_RECOMMENDATIONS_ENABLED=true
ML_PROVIDER=HYBRID              # RULE_BASED | ML | HYBRID
ML_INFERENCE_TIMEOUT_MS=2000
ML_HYBRID_ML_WEIGHT=0.6
ML_HYBRID_RULE_WEIGHT=0.4
ML_CACHE_TTL=300
ML_TRAINING_LOOKBACK_DAYS=90
```

---

## 6. Verification and Test Results

Ran complete test suite in `medusa/packages/medusa/src/api/store/products/__tests__/recommendations.spec.ts`:
- **19 passing test cases**:
  - Deterministic similar products scoring & ranking
  - Frequently bought together co-purchases aggregation
  - Tie-breaking logic (`Score DESC` $\rightarrow$ `CreatedAt DESC` $\rightarrow$ `ID ASC`)
  - ML provider candidate generation and customer profile cold-start
  - Hybrid weighted scoring & business rule filtering
  - Offline training pipeline temporal split & artifact persistence
  - Storefront REST APIs (`/similar`, `/frequently-bought-together`, `/popular`, `/trending`, `/recommendations`)
  - Admin ML model management REST APIs (List, Train, Activate, Rollback, Metrics)
