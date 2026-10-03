import { GET as listReviews } from "../route"
import { GET as getReview } from "../[id]/route"
import { approveProductReviewWorkflow } from "../../../../../../core/core-flows/src/review/workflows/approve-product-review"
import { rejectProductReviewWorkflow } from "../../../../../../core/core-flows/src/review/workflows/reject-product-review"
import { replyToProductReviewWorkflow } from "../../../../../../core/core-flows/src/review/workflows/reply-to-product-review"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Admin Reviews Moderation API & Workflows", () => {
  describe("Admin List Reviews with Filters", () => {
    it("should pass status and verified_purchase filters to service", async () => {
      const mockReviewService = {
        listAndCountProductReviews: jest.fn().mockResolvedValue([[], 0]),
      }

      const req: any = {
        scope: {
          resolve: jest.fn().mockReturnValue(mockReviewService),
        },
        validatedQuery: {
          status: "PENDING",
          verified_purchase: true,
          rating: 5,
        },
        queryConfig: { pagination: { take: 10, skip: 0 } },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await listReviews(req, res)

      expect(mockReviewService.listAndCountProductReviews).toHaveBeenCalledWith(
        {
          status: "PENDING",
          verified_purchase: true,
          rating: 5,
        },
        expect.objectContaining({ take: 10, skip: 0 })
      )
    })
  })

  describe("approveProductReviewWorkflow & rejectProductReviewWorkflow", () => {
    it("should update review status to APPROVED", async () => {
      const mockReviewService = {
        retrieveProductReview: jest.fn().mockResolvedValue({ id: "rev_1", status: "PENDING" }),
        updateProductReviews: jest.fn().mockResolvedValue([{ id: "rev_1", status: "APPROVED" }]),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.REVIEW]: asValue(mockReviewService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await approveProductReviewWorkflow(container).run({
        input: { id: "rev_1" },
        container,
        throwOnError: true,
      })

      expect(result.status).toBe("APPROVED")
    })

    it("should update review status to REJECTED", async () => {
      const mockReviewService = {
        retrieveProductReview: jest.fn().mockResolvedValue({ id: "rev_1", status: "PENDING" }),
        updateProductReviews: jest.fn().mockResolvedValue([{ id: "rev_1", status: "REJECTED" }]),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.REVIEW]: asValue(mockReviewService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await rejectProductReviewWorkflow(container).run({
        input: { id: "rev_1" },
        container,
        throwOnError: true,
      })

      expect(result.status).toBe("REJECTED")
    })
  })

  describe("replyToProductReviewWorkflow", () => {
    it("should create new reply if none exists for review", async () => {
      const mockReviewService = {
        retrieveProductReview: jest.fn().mockResolvedValue({ id: "rev_1" }),
        listReviewReplies: jest.fn().mockResolvedValue([]),
        createReviewReplies: jest.fn().mockResolvedValue([
          { id: "rrep_1", review_id: "rev_1", admin_id: "user_admin", content: "Thank you for the review!" },
        ]),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.REVIEW]: asValue(mockReviewService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await replyToProductReviewWorkflow(container).run({
        input: {
          review_id: "rev_1",
          admin_id: "user_admin",
          content: "Thank you for the review!",
        },
        container,
        throwOnError: true,
      })

      expect(result.content).toBe("Thank you for the review!")
      expect(mockReviewService.createReviewReplies).toHaveBeenCalledWith([
        {
          review_id: "rev_1",
          admin_id: "user_admin",
          content: "Thank you for the review!",
        },
      ])
    })
  })
})
