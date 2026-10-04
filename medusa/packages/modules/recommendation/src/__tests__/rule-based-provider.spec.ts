import { RuleBasedRecommendationProvider } from "../providers/rule-based-provider"
import { Modules } from "@medusajs/framework/utils"

describe("RuleBasedRecommendationProvider", () => {
  let provider: RuleBasedRecommendationProvider

  beforeEach(() => {
    provider = new RuleBasedRecommendationProvider()
  })

  describe("Similar Products Scoring", () => {
    it("should correctly score products based on category, collection, type, tags, and price", async () => {
      const targetProduct = {
        id: "prod_target",
        categories: [{ id: "cat_shoes" }],
        collection_id: "col_nike",
        type_id: "type_running",
        tags: [{ id: "tag_mesh" }],
        variants: [{ calculated_price: { calculated_amount: 100 } }],
      }

      const candidateHighMatch = {
        id: "prod_high",
        status: "published",
        created_at: "2025-01-01",
        categories: [{ id: "cat_shoes" }],
        collection_id: "col_nike",
        type_id: "type_running",
        tags: [{ id: "tag_mesh" }],
        variants: [{ calculated_price: { calculated_amount: 105 } }],
      }

      const candidateLowMatch = {
        id: "prod_low",
        status: "published",
        created_at: "2025-01-01",
        categories: [{ id: "cat_shoes" }],
        collection_id: "col_other",
        type_id: "type_other",
        tags: [],
        variants: [{ calculated_price: { calculated_amount: 200 } }],
      }

      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue(targetProduct),
        listAndCountProducts: jest.fn().mockResolvedValue([
          [candidateHighMatch, candidateLowMatch],
          2,
        ]),
      }

      const mockContainer = {
        resolve: jest.fn().mockReturnValue(mockProductService),
      }

      const result = await provider.getRecommendations(
        {
          productId: "prod_target",
          type: "SIMILAR",
          limit: 10,
        },
        mockContainer
      )

      expect(result.products.length).toBe(2)
      expect(result.products[0].id).toBe("prod_high")
      // score calculation: category(40) + collection(20) + type(20) + tag(10) + price(10) = 100
      expect(result.products[0].recommendation_score).toBe(100)
      expect(result.products[1].id).toBe("prod_low")
      expect(result.products[1].recommendation_score).toBe(40)
    })
  })

  describe("Frequently Bought Together", () => {
    it("should calculate co-purchase relationships from order data", async () => {
      const mockOrderService = {
        listAndCountOrders: jest.fn().mockResolvedValue([
          [
            {
              id: "ord_1",
              status: "completed",
              items: [
                { product_id: "prod_target" },
                { product_id: "prod_copurchased" },
              ],
            },
            {
              id: "ord_2",
              status: "canceled",
              items: [
                { product_id: "prod_target" },
                { product_id: "prod_canceled_pair" },
              ],
            },
          ],
          2,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            {
              id: "prod_copurchased",
              title: "Matching Accessory",
              status: "published",
            },
          ],
          1,
        ]),
      }

      const mockContainer = {
        resolve: jest.fn().mockImplementation((key) => {
          if (key === Modules.ORDER) return mockOrderService
          if (key === Modules.PRODUCT) return mockProductService
          return null
        }),
      }

      const result = await provider.getRecommendations(
        {
          productId: "prod_target",
          type: "FREQUENTLY_BOUGHT_TOGETHER",
        },
        mockContainer
      )

      expect(result.products.length).toBe(1)
      expect(result.products[0].id).toBe("prod_copurchased")
      expect(result.strategy_used).toBe("FREQUENTLY_BOUGHT_TOGETHER")
    })
  })

  describe("Deterministic Ranking and Tie-Breaking", () => {
    it("should break ties deterministically by created_at DESC and ID ASC", async () => {
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

      const mockContainer = {
        resolve: jest.fn().mockReturnValue(mockProductService),
      }

      const result = await provider.getRecommendations(
        {
          productId: "prod_target",
          type: "SIMILAR",
        },
        mockContainer
      )

      // Both have identical score and created_at -> tie-broken by ID ASC (prod_a before prod_b)
      expect(result.products[0].id).toBe("prod_a")
      expect(result.products[1].id).toBe("prod_b")
    })
  })
})
