import { GET as getReviews, POST as createReview } from "../[id]/reviews/route"
import { GET as getReviewSummary } from "../[id]/reviews/summary/route"
import { createProductReviewWorkflow } from "../../../../../../core/core-flows/src/review/workflows/create-product-review"
import { ContainerRegistrationKeys, createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Store Product Reviews API & Workflow Steps", () => {
  describe("createProductReviewWorkflow", () => {
    it("should throw invalid data error if rating is outside 1..5", async () => {
      const container = createMedusaContainer()

      const { errors } = await createProductReviewWorkflow(container).run({
        input: {
          product_id: "prod_1",
          customer_id: "cus_1",
          rating: 6,
          content: "Great product",
        },
        container,
        throwOnError: true,
      }).catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Rating must be an integer or number between 1 and 5")
    })

    it("should throw invalid data error if content is empty", async () => {
      const container = createMedusaContainer()

      const { errors } = await createProductReviewWorkflow(container).run({
        input: {
          product_id: "prod_1",
          customer_id: "cus_1",
          rating: 5,
          content: "   ",
        },
        container,
        throwOnError: true,
      }).catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Review content cannot be empty")
    })

    it("should throw not found error if product does not exist", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [] }),
      }
      const container = createMedusaContainer()
      container.register({
        [ContainerRegistrationKeys.QUERY]: asValue(mockQuery),
      })

      const { errors } = await createProductReviewWorkflow(container).run({
        input: {
          product_id: "prod_invalid",
          customer_id: "cus_1",
          rating: 5,
          content: "Good product",
        },
        container,
        throwOnError: true,
      }).catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Product with id: prod_invalid was not found")
    })

    it("should throw duplicate error if customer already reviewed product", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [{ id: "prod_1" }] }),
      }
      const mockReviewService = {
        listProductReviews: jest.fn().mockResolvedValue([{ id: "rev_existing" }]),
      }

      const container = createMedusaContainer()
      container.register({
        [ContainerRegistrationKeys.QUERY]: asValue(mockQuery),
        [Modules.REVIEW]: asValue(mockReviewService),
      })

      const { errors } = await createProductReviewWorkflow(container).run({
        input: {
          product_id: "prod_1",
          customer_id: "cus_1",
          rating: 5,
          content: "Duplicate review attempt",
        },
        container,
        throwOnError: true,
      }).catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("has already submitted a review for product")
    })

    it("should calculate verified_purchase=true when customer has purchased product", async () => {
      const mockQuery = {
        graph: jest.fn((query) => {
          if (query.entity === "product") {
            return Promise.resolve({ data: [{ id: "prod_1" }] })
          }
          if (query.entity === "order") {
            return Promise.resolve({
              data: [
                {
                  id: "ord_1",
                  customer_id: "cus_1",
                  items: [{ product_id: "prod_1" }],
                },
              ],
            })
          }
          return Promise.resolve({ data: [] })
        }),
      }

      const mockReviewService = {
        listProductReviews: jest.fn().mockResolvedValue([]),
        createProductReviews: jest.fn().mockImplementation((inputArray) =>
          Promise.resolve(
            inputArray.map((item: any, idx: number) => ({
              id: `rev_${idx + 1}`,
              ...item,
            }))
          )
        ),
      }

      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [ContainerRegistrationKeys.QUERY]: asValue(mockQuery),
        [Modules.REVIEW]: asValue(mockReviewService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createProductReviewWorkflow(container).run({
        input: {
          product_id: "prod_1",
          customer_id: "cus_1",
          rating: 5,
          title: "Awesome",
          content: "Great product quality",
        },
        container,
        throwOnError: true,
      })

      expect(result.verified_purchase).toBe(true)
      expect(result.status).toBe("PENDING")
    })
  })

  describe("Store GET Reviews route (Visibility Filtering)", () => {
    it("should return only APPROVED reviews for storefront", async () => {
      const mockReviewService = {
        listAndCountProductReviews: jest.fn().mockResolvedValue([
          [
            {
              id: "rev_1",
              product_id: "prod_1",
              customer_id: "cus_1",
              rating: 5,
              title: "Great",
              content: "Approved review text",
              status: "APPROVED",
              verified_purchase: true,
              reply: { id: "rrep_1", content: "Thanks!", created_at: "2025-01-01" },
              created_at: "2025-01-01",
              updated_at: "2025-01-01",
            },
          ],
          1,
        ]),
      }

      const req: any = {
        params: { id: "prod_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockReviewService),
        },
        queryConfig: { pagination: { take: 20, skip: 0 } },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getReviews(req, res)

      expect(mockReviewService.listAndCountProductReviews).toHaveBeenCalledWith(
        { product_id: "prod_1", status: "APPROVED" },
        expect.anything()
      )
      expect(jsonMock).toHaveBeenCalledWith({
        reviews: [
          expect.objectContaining({
            id: "rev_1",
            rating: 5,
            status: "APPROVED",
            reply: expect.objectContaining({ content: "Thanks!" }),
          }),
        ],
        count: 1,
        limit: 20,
        offset: 0,
      })
    })
  })

  describe("Store POST Review route (Guest restriction)", () => {
    it("should throw 401 if unauthenticated guest attempts to post review", async () => {
      const req: any = {
        params: { id: "prod_1" },
        auth_context: null,
      }
      const res: any = {}

      await expect(createReview(req, res)).rejects.toThrow(
        "Authentication required to submit a review"
      )
    })
  })

  describe("Store Rating Summary route", () => {
    it("should return 0 count and 0 average rating when product has no approved reviews", async () => {
      const mockReviewService = {
        listProductReviews: jest.fn().mockResolvedValue([]),
      }

      const req: any = {
        params: { id: "prod_empty" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockReviewService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getReviewSummary(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        average_rating: 0,
        review_count: 0,
        rating_distribution: {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
        },
      })
    })

    it("should correctly compute rating average and distribution from approved reviews", async () => {
      const mockReviewService = {
        listProductReviews: jest.fn().mockResolvedValue([
          { rating: 5 },
          { rating: 5 },
          { rating: 4 },
          { rating: 3 },
        ]),
      }

      const req: any = {
        params: { id: "prod_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockReviewService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getReviewSummary(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        average_rating: 4.3, // (5+5+4+3)/4 = 17/4 = 4.25 -> 4.3
        review_count: 4,
        rating_distribution: {
          "1": 0,
          "2": 0,
          "3": 1,
          "4": 1,
          "5": 2,
        },
      })
    })
  })
})
