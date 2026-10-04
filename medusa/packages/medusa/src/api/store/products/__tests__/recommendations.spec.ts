import { RuleBasedRecommendationProvider, MLRecommendationProvider, HybridRecommendationProvider, OfflineTrainingPipeline } from "@medusajs/recommendation"
import { GET as getSimilarProducts } from "../[id]/similar/route"
import { GET as getFrequentlyBoughtTogether } from "../[id]/frequently-bought-together/route"
import { GET as getPopularProducts } from "../popular/route"
import { GET as getTrendingProducts } from "../trending/route"
import { GET as getRecommendations } from "../../recommendations/route"
import { GET as getAdminRelationships, POST as postAdminRelationship } from "../../../admin/product-relationships/route"
import { GET as getAdminRelById, DELETE as deleteAdminRelById } from "../../../admin/product-relationships/[id]/route"
import { GET as getAdminConfig } from "../../../admin/recommendations/config/route"
import { GET as getAdminModels } from "../../../admin/recommendations/models/route"
import { POST as postAdminTrainModel } from "../../../admin/recommendations/models/train/route"
import { POST as postAdminActivateModel } from "../../../admin/recommendations/models/[id]/activate/route"
import { POST as postAdminRollbackModel } from "../../../admin/recommendations/models/[id]/rollback/route"
import { GET as getAdminMetrics } from "../../../admin/recommendations/metrics/route"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Recommendation & Product Intelligence Suite", () => {
  let provider: RuleBasedRecommendationProvider

  beforeEach(() => {
    provider = new RuleBasedRecommendationProvider()
  })

  describe("RuleBasedRecommendationProvider Unit Tests", () => {
    it("should calculate deterministic similar products scores and rank candidate products", async () => {
      const targetProduct = {
        id: "prod_target",
        categories: [{ id: "cat_shoes" }],
        collection_id: "col_nike",
        type_id: "type_running",
        tags: [{ id: "tag_mesh" }],
        variants: [{ calculated_price: { calculated_amount: 100 } }],
      }

      const candidateHigh = {
        id: "prod_high",
        status: "published",
        created_at: "2025-01-01",
        categories: [{ id: "cat_shoes" }],
        collection_id: "col_nike",
        type_id: "type_running",
        tags: [{ id: "tag_mesh" }],
        variants: [{ calculated_price: { calculated_amount: 105 } }],
      }

      const candidateLow = {
        id: "prod_low",
        status: "published",
        created_at: "2025-01-01",
        categories: [{ id: "cat_shoes" }],
        collection_id: "col_other",
        type_id: "type_other",
        tags: [],
        variants: [{ calculated_price: { calculated_amount: 300 } }],
      }

      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue(targetProduct),
        listAndCountProducts: jest.fn().mockResolvedValue([
          [candidateHigh, candidateLow],
          2,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const result = await provider.getRecommendations(
        {
          productId: "prod_target",
          type: "SIMILAR",
          limit: 10,
        },
        container
      )

      expect(result.products.length).toBe(2)
      expect(result.products[0].id).toBe("prod_high")
      expect(result.products[0].recommendation_score).toBe(100)
      expect(result.products[1].id).toBe("prod_low")
      expect(result.products[1].recommendation_score).toBe(40)
    })

    it("should aggregate co-purchases from non-canceled orders for Frequently Bought Together", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_1",
              status: "completed",
              items: [
                { product_id: "prod_target" },
                { product_id: "prod_fbt" },
              ],
            },
            {
              id: "ord_2",
              status: "canceled",
              items: [
                { product_id: "prod_target" },
                { product_id: "prod_invalid" },
              ],
            },
          ],
          2,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [{ id: "prod_fbt", title: "FBT Product", status: "published" }],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.ORDER]: asValue(mockOrderService),
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const result = await provider.getRecommendations(
        {
          productId: "prod_target",
          type: "FREQUENTLY_BOUGHT_TOGETHER",
        },
        container
      )

      expect(result.products.length).toBe(1)
      expect(result.products[0].id).toBe("prod_fbt")
      expect(result.strategy_used).toBe("FREQUENTLY_BOUGHT_TOGETHER")
    })

    it("should perform deterministic tie-breaking by created_at DESC and ID ASC", async () => {
      const prodA = {
        id: "prod_a",
        status: "published",
        created_at: "2025-01-01T00:00:00Z",
        categories: [{ id: "cat_shoes" }],
      }
      const prodB = {
        id: "prod_b",
        status: "published",
        created_at: "2025-01-01T00:00:00Z",
        categories: [{ id: "cat_shoes" }],
      }

      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({
          id: "prod_target",
          categories: [{ id: "cat_shoes" }],
        }),
        listAndCountProducts: jest
          .fn()
          .mockResolvedValue([[prodB, prodA], 2]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const result = await provider.getRecommendations(
        {
          productId: "prod_target",
          type: "SIMILAR",
        },
        container
      )

      expect(result.products[0].id).toBe("prod_a")
      expect(result.products[1].id).toBe("prod_b")
    })
  })

  describe("MLRecommendationProvider & HybridRecommendationProvider Unit Tests", () => {
    it("MLProvider should generate candidates from active model similarity matrix and attach explanations", async () => {
      process.env.ML_RECOMMENDATIONS_ENABLED = "true"
      const mlProvider = new MLRecommendationProvider()

      const mockContainer = {
        hasRegistration: (key: string) => true,
        resolve: (key: string) => {
          if (key === Modules.RECOMMENDATION) {
            return {
              getActiveModel: async () => ({
                id: "recmod_01",
                version: "v20260330_1000",
                status: "ACTIVE",
                is_active: true,
                artifact_data: {
                  similarity_matrix: {
                    prod_1: { prod_2: 95, prod_3: 80 },
                  },
                },
              }),
            }
          }
          if (key === Modules.PRODUCT) {
            return {
              listAndCountProducts: async (filters: any) => {
                const products = [
                  { id: "prod_2", title: "Product Two", status: "published", created_at: "2026-03-01T00:00:00Z" },
                  { id: "prod_3", title: "Product Three", status: "published", created_at: "2026-03-02T00:00:00Z" },
                ]
                return [products, products.length]
              },
            }
          }
          return null
        },
      }

      const result = await mlProvider.getRecommendations(
        { productId: "prod_1", limit: 10, offset: 0 },
        mockContainer
      )

      expect(result.fallback_applied).toBe(false)
      expect(result.strategy_used).toContain("ML_MODEL_v20260330_1000")
      expect(result.products.length).toBe(2)
      expect(result.products[0].id).toBe("prod_2")
      expect(result.products[0].recommendation_explanation).toBe("Similar to products you viewed")
    })

    it("HybridProvider should combine normalized ML & Rule scores according to configured weights", async () => {
      process.env.ML_RECOMMENDATIONS_ENABLED = "true"
      process.env.ML_HYBRID_ML_WEIGHT = "0.6"
      process.env.ML_HYBRID_RULE_WEIGHT = "0.4"
      const hybridProvider = new HybridRecommendationProvider()

      const mockContainer = {
        hasRegistration: (key: string) => true,
        resolve: (key: string) => {
          if (key === Modules.RECOMMENDATION) {
            return {
              getActiveModel: async () => ({
                id: "recmod_01",
                version: "v1.0.0",
                status: "ACTIVE",
                artifact_data: {
                  similarity_matrix: {
                    prod_1: { prod_2: 100, prod_3: 50 },
                  },
                },
              }),
              listAndCountProductRelationships: async () => [[], 0],
            }
          }
          if (key === Modules.PRODUCT) {
            return {
              retrieveProduct: async (id: string) => ({
                id,
                categories: [{ id: "cat_1" }],
                collection_id: "col_1",
                variants: [{ calculated_price: { calculated_amount: 100 } }],
              }),
              listAndCountProducts: async () => {
                const products = [
                  {
                    id: "prod_2",
                    title: "Product 2",
                    status: "published",
                    categories: [{ id: "cat_1" }],
                    collection_id: "col_1",
                    created_at: "2026-03-01T00:00:00Z",
                    variants: [{ calculated_price: { calculated_amount: 100 } }],
                  },
                  {
                    id: "prod_3",
                    title: "Product 3",
                    status: "published",
                    categories: [{ id: "cat_1" }],
                    created_at: "2026-03-02T00:00:00Z",
                    variants: [{ calculated_price: { calculated_amount: 100 } }],
                  },
                ]
                return [products, products.length]
              },
            }
          }
          return null
        },
      }

      const result = await hybridProvider.getRecommendations(
        { productId: "prod_1", limit: 10, offset: 0 },
        mockContainer
      )

      expect(result.fallback_applied).toBe(false)
      expect(result.strategy_used).toBe("HYBRID_RECOMMENDATION")
      expect(result.products.length).toBeGreaterThan(0)
      expect(result.products[0].recommendation_explanation).toBe("Hybrid AI & Rule-based recommendation")
    })

    it("OfflineTrainingPipeline should train model, perform temporal split, compute metrics and persist artifact", async () => {
      let createdModel: any = null
      const pipeline = new OfflineTrainingPipeline({ lookbackDays: 30, validationSplitRatio: 0.2 })

      const mockContainer = {
        resolve: (key: string) => {
          if (key === Modules.RECOMMENDATION) {
            return {
              createRecommendationModels: async (records: any[]) => {
                createdModel = { id: "recmod_train_1", ...records[0] }
                return [createdModel]
              },
              updateRecommendationModels: async (data: any) => {
                createdModel = { ...createdModel, ...data }
                return [createdModel]
              },
            }
          }
          if (key === Modules.ORDER) {
            return {
              listAndCountOrders: async () => {
                const now = Date.now()
                const orders = [
                  {
                    id: "ord_1",
                    customer_id: "cust_1",
                    created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
                    items: [{ product_id: "prod_a" }, { product_id: "prod_b" }],
                  },
                  {
                    id: "ord_2",
                    customer_id: "cust_2",
                    created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    items: [{ product_id: "prod_a" }, { product_id: "prod_b" }],
                  },
                ]
                return [orders, orders.length]
              },
            }
          }
          if (key === Modules.PRODUCT) {
            return {
              listAndCountProducts: async () => [[], 10],
            }
          }
          return null
        },
      }

      const trainedModel = await pipeline.runTrainingPipeline(mockContainer)

      expect(trainedModel.status).toBe("READY")
      expect(trainedModel.metrics).toBeDefined()
      expect(trainedModel.metrics.catalog_coverage).toBeGreaterThanOrEqual(0)
      expect(trainedModel.artifact_data.similarity_matrix.prod_a.prod_b).toBeGreaterThan(0)
    })
  })

  describe("Storefront Recommendation API Routes", () => {
    it("GET /store/products/:id/similar should execute workflow and return similar products", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({
          id: "prod_1",
          categories: [{ id: "cat_1" }],
        }),
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            {
              id: "prod_2",
              title: "Similar Prod",
              status: "published",
              categories: [{ id: "cat_1" }],
            },
          ],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const req: any = {
        params: { id: "prod_1" },
        query: { limit: "5", offset: "0" },
        scope: container,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getSimilarProducts(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          products: expect.arrayContaining([
            expect.objectContaining({ id: "prod_2" }),
          ]),
          strategy_used: "SIMILAR_PRODUCTS",
        })
      )
    })

    it("GET /store/products/:id/frequently-bought-together should return co-purchased items", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_100",
              status: "completed",
              items: [{ product_id: "prod_x" }, { product_id: "prod_y" }],
            },
          ],
          1,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [{ id: "prod_y", title: "Co-purchased Y", status: "published" }],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.ORDER]: asValue(mockOrderService),
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const req: any = {
        params: { id: "prod_x" },
        query: {},
        scope: container,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getFrequentlyBoughtTogether(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          products: expect.arrayContaining([
            expect.objectContaining({ id: "prod_y" }),
          ]),
          strategy_used: "FREQUENTLY_BOUGHT_TOGETHER",
        })
      )
    })

    it("GET /store/products/popular should return popular products ranked by sales and ratings", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_pop1",
              status: "completed",
              items: [{ product_id: "prod_pop", quantity: 10 }],
            },
          ],
          1,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [{ id: "prod_pop", title: "Popular Item", status: "published" }],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.ORDER]: asValue(mockOrderService),
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const req: any = {
        query: { limit: "10" },
        scope: container,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getPopularProducts(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          products: expect.arrayContaining([
            expect.objectContaining({ id: "prod_pop" }),
          ]),
        })
      )
    })

    it("GET /store/products/trending should calculate time-window sales growth", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_trend",
              status: "completed",
              created_at: new Date().toISOString(),
              items: [{ product_id: "prod_trend", quantity: 5 }],
            },
          ],
          1,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [{ id: "prod_trend", title: "Trending Item", status: "published" }],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.ORDER]: asValue(mockOrderService),
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const req: any = {
        query: { period: "7d" },
        scope: container,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getTrendingProducts(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          products: expect.arrayContaining([
            expect.objectContaining({ id: "prod_trend" }),
          ]),
          strategy_used: "TRENDING_PRODUCTS",
        })
      )
    })

    it("GET /store/recommendations should accept customer context and isolate customer data", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([[], 0]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [{ id: "prod_rec", title: "Rec Item", status: "published" }],
          1,
        ]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.ORDER]: asValue(mockOrderService),
        [Modules.PRODUCT]: asValue(mockProductService),
      })

      const req: any = {
        auth_context: { actor_id: "cust_123" },
        query: { type: "CUSTOMER_AWARE" },
        scope: container,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getRecommendations(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          recommendations: expect.arrayContaining([
            expect.objectContaining({ id: "prod_rec" }),
          ]),
        })
      )
    })
  })

  describe("Admin Recommendation ML Management API Routes", () => {
    it("GET /admin/recommendations/models should list models and active model", async () => {
      const mockRecService = {
        listAndCountRecommendationModels: jest.fn().mockResolvedValue([
          [{ id: "recmod_1", version: "v1.0.0", status: "ACTIVE" }],
          1,
        ]),
        getActiveModel: jest.fn().mockResolvedValue({
          id: "recmod_1",
          version: "v1.0.0",
        }),
      }

      const req: any = {
        query: {},
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getAdminModels(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          active_model: expect.objectContaining({ id: "recmod_1" }),
        })
      )
    })

    it("POST /admin/recommendations/models/train should trigger model training", async () => {
      const mockRecService = {
        createRecommendationModels: jest.fn().mockResolvedValue([
          { id: "recmod_new", version: "v20260330", status: "TRAINING" },
        ]),
        updateRecommendationModels: jest.fn().mockResolvedValue([
          { id: "recmod_new", version: "v20260330", status: "READY" },
        ]),
      }

      const req: any = {
        body: { lookback_days: 30 },
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await postAdminTrainModel(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "ML recommendation model trained successfully",
        })
      )
    })

    it("POST /admin/recommendations/models/:id/activate should activate model", async () => {
      const mockRecService = {
        activateModel: jest.fn().mockResolvedValue({
          id: "recmod_1",
          is_active: true,
          status: "ACTIVE",
        }),
      }

      const req: any = {
        params: { id: "recmod_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await postAdminActivateModel(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({ is_active: true }),
        })
      )
    })

    it("POST /admin/recommendations/models/:id/rollback should rollback active model", async () => {
      const mockRecService = {
        rollbackModel: jest.fn().mockResolvedValue({
          id: "recmod_prev",
          is_active: true,
          status: "ACTIVE",
        }),
      }

      const req: any = {
        params: { id: "recmod_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await postAdminRollbackModel(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Rolled back to previous model version successfully",
        })
      )
    })

    it("GET /admin/recommendations/metrics should return active model evaluation metrics", async () => {
      const mockRecService = {
        getActiveModel: jest.fn().mockResolvedValue({
          id: "recmod_1",
          metrics: { hit_rate_at_k: 0.85, catalog_coverage: 0.92 },
        }),
      }

      const req: any = {
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getAdminMetrics(req, res)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.objectContaining({ hit_rate_at_k: 0.85 }),
        })
      )
    })
  })

  describe("Admin Relationship & Config Management API Routes", () => {
    it("POST /admin/product-relationships and GET /admin/product-relationships should create and list relationships", async () => {
      const mockRel = {
        id: "prrel_1",
        source_product_id: "prod_source",
        related_product_id: "prod_target",
        relationship_type: "UPSELL",
        priority: 10,
        is_active: true,
      }

      const mockRecommendationService = {
        createProductRelationships: jest.fn().mockResolvedValue(mockRel),
        listAndCountProductRelationships: jest
          .fn()
          .mockResolvedValue([[mockRel], 1]),
      }

      const reqPost: any = {
        body: {
          source_product_id: "prod_source",
          related_product_id: "prod_target",
          relationship_type: "UPSELL",
          priority: 10,
        },
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecommendationService),
        },
      }

      const jsonMockPost = jest.fn()
      const statusMockPost = jest.fn().mockReturnValue({ json: jsonMockPost })
      const resPost: any = { status: statusMockPost }

      await postAdminRelationship(reqPost, resPost)

      expect(statusMockPost).toHaveBeenCalledWith(201)
      expect(jsonMockPost).toHaveBeenCalledWith({
        product_relationship: mockRel,
      })

      const reqGet: any = {
        query: { source_product_id: "prod_source" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecommendationService),
        },
      }

      const jsonMockGet = jest.fn()
      const resGet: any = { json: jsonMockGet }

      await getAdminRelationships(reqGet, resGet)

      expect(jsonMockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          product_relationships: [mockRel],
          count: 1,
        })
      )
    })

    it("DELETE /admin/product-relationships/:id should delete relationship", async () => {
      const mockRecommendationService = {
        deleteProductRelationships: jest.fn().mockResolvedValue(undefined),
      }

      const req: any = {
        params: { id: "prrel_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockRecommendationService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await deleteAdminRelById(req, res)

      expect(mockRecommendationService.deleteProductRelationships).toHaveBeenCalledWith(
        "prrel_1"
      )
      expect(jsonMock).toHaveBeenCalledWith({
        id: "prrel_1",
        object: "product_relationship",
        deleted: true,
      })
    })

    it("GET /admin/recommendations/config should return system configuration and status", async () => {
      const req: any = {}
      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getAdminConfig(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        config: expect.objectContaining({
          provider: "RULE_BASED",
          ml_ready: true,
        }),
      })
    })
  })
})
