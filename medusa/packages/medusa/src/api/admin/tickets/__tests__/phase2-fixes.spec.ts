const mockWorkflowRun = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  listShippingOptionsForCartWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  addTicketMessageWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  updateTicketStatusWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  updateTicketPriorityWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  assignTicketWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  getOrdersListWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  createCampaignsWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
  updateCampaignsWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
}))

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { GET as getActiveFreeShipping } from "../../../store/free-shipping-rules/active/route"
import { GET as getStoreShippingOptions } from "../../../store/shipping-options/route"
import { GET as getStoreTicketDetail } from "../../../store/tickets/[id]/route"
import { defaultStoreProductFields } from "../../../store/products/query-config"
import {
  POST as createCampaign,
} from "../../campaigns/route"
import {
  PATCH as patchCampaign,
} from "../../campaigns/[id]/route"
import {
  enrichPromotionResponse,
  extractPromotionMetadataFields,
} from "../../promotions/helpers"
import { POST as createFreeShippingRule } from "../../free-shipping-rules/route"
import { POST as uploadTicketAttachment } from "../../ticket-attachments/route"
import { POST as postTicketMessage } from "../[id]/messages/route"
import { POST as updateTicketStatus } from "../[id]/status/route"
import { POST as updateTicketPriority } from "../[id]/priority/route"
import { POST as assignTicket } from "../[id]/assign/route"
import { GET as listAdminOrders } from "../../orders/route"

describe("Storefront Free Shipping, Discounts, Tickets & Admin Orders Fixes", () => {
  describe("Free Shipping Active Endpoint & Shipping Options", () => {
    it("returns has_active_rule=false when no active rules exist", async () => {
      const mockPromotionService = {
        listFreeShippingRules: jest.fn().mockResolvedValue([]),
      }
      const req: any = {
        query: {},
        scope: {
          resolve: jest.fn((key) => {
            if (key === Modules.PROMOTION) return mockPromotionService
            return null
          }),
        },
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await getActiveFreeShipping(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        free_shipping: {
          has_active_rule: false,
          is_eligible: false,
          rule_title: null,
          min_purchase_amount_irr: null,
          remaining_amount_irr: null,
        },
        rules: [],
      })
    })

    it("computes remaining_amount_irr and is_eligible for cart", async () => {
      const mockPromotionService = {
        listFreeShippingRules: jest.fn().mockResolvedValue([
          {
            id: "fsr_1",
            title: "ارسال رایگان برای خرید بالای ۵ میلیون تومان",
            scope: "store",
            min_purchase_amount: 50000000,
            is_active: true,
          },
        ]),
      }
      const mockCartService = {
        retrieveCart: jest.fn().mockResolvedValue({
          id: "cart_1",
          subtotal: 35000000,
          items: [],
        }),
      }
      const req: any = {
        query: { cart_id: "cart_1" },
        scope: {
          resolve: jest.fn((key) => {
            if (key === Modules.PROMOTION) return mockPromotionService
            if (key === Modules.CART) return mockCartService
            return null
          }),
        },
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await getActiveFreeShipping(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          free_shipping: {
            has_active_rule: true,
            is_eligible: false,
            rule_title: "ارسال رایگان برای خرید بالای ۵ میلیون تومان",
            min_purchase_amount_irr: 50000000,
            remaining_amount_irr: 15000000,
          },
        })
      )
    })

    it("includes free_shipping object in GET /store/shipping-options", async () => {
      mockWorkflowRun.mockResolvedValueOnce({
        result: [{ id: "so_1", amount: 500000 }],
      })
      const mockPromotionService = {
        listFreeShippingRules: jest.fn().mockResolvedValue([]),
      }
      const req: any = {
        filterableFields: { cart_id: "cart_1" },
        queryConfig: { fields: [] },
        scope: {
          resolve: jest.fn((key) => {
            if (key === Modules.PROMOTION) return mockPromotionService
            return null
          }),
        },
      }
      const res: any = {
        json: jest.fn().mockReturnThis(),
      }

      await getStoreShippingOptions(req, res)

      expect(res.json).toHaveBeenCalledWith({
        shipping_options: [
          expect.objectContaining({ id: "so_1", amount: 500000, is_free: false }),
        ],
        free_shipping: {
          has_active_rule: false,
          is_eligible: false,
          rule_title: null,
          min_purchase_amount_irr: null,
          remaining_amount_irr: null,
        },
      })
    })
  })

  describe("Promotions & Free Shipping Rules Extra Fields", () => {
    it("extracts title/description/dates/usage_limit into metadata and enriches response with used_count", () => {
      const payload = extractPromotionMetadataFields({
        code: "YALDA",
        title: "تخفیف یلدا",
        description: "۲۰ درصد تخفیف",
        starts_at: new Date("2026-12-20T00:00:00.000Z"),
        ends_at: new Date("2026-12-22T00:00:00.000Z"),
        usage_limit: 100,
      })

      expect(payload.limit).toBe(100)
      expect(payload.metadata).toEqual({
        title: "تخفیف یلدا",
        description: "۲۰ درصد تخفیف",
        starts_at: "2026-12-20T00:00:00.000Z",
        ends_at: "2026-12-22T00:00:00.000Z",
        usage_limit: 100,
      })

      const enriched = enrichPromotionResponse({
        id: "promo_1",
        code: "YALDA",
        used: 7,
        limit: 100,
        metadata: payload.metadata,
      })

      expect(enriched.title).toBe("تخفیف یلدا")
      expect(enriched.description).toBe("۲۰ درصد تخفیف")
      expect(enriched.usage_limit).toBe(100)
      expect(enriched.used_count).toBe(7)
    })

    it("stores and surfaces description, max_purchase_amount, usage_limit, used_count on FreeShippingRule", async () => {
      const mockPromotionService = {
        createFreeShippingRules: jest.fn().mockImplementation(async (data) => ({
          id: "fsr_new",
          ...data,
        })),
      }
      const req: any = {
        validatedBody: {
          title: "ارسال رایگان",
          description: "توضیحات قانون",
          scope: "store",
          min_purchase_amount: 10000000,
          max_purchase_amount: 50000000,
          usage_limit: 50,
          used_count: 0,
          is_active: true,
        },
        scope: {
          resolve: jest.fn((key) =>
            key === Modules.PROMOTION ? mockPromotionService : null
          ),
        },
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await createFreeShippingRule(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        free_shipping_rule: expect.objectContaining({
          id: "fsr_new",
          description: "توضیحات قانون",
          max_purchase_amount: 50000000,
          usage_limit: 50,
          used_count: 0,
        }),
      })
    })
  })

  describe("Admin Support Tickets Fixes", () => {
    it("uploads attachment and sends admin message with sender_type=admin and sender_name", async () => {
      const uploadReq: any = {
        file: {
          originalname: "receipt.png",
          mimetype: "image/png",
          size: 4,
          buffer: Buffer.from("test"),
        },
      }
      const uploadRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await uploadTicketAttachment(uploadReq, uploadRes)
      const uploadedPayload = uploadRes.json.mock.calls[0][0]
      expect(uploadedPayload.attachment_id).toMatch(/^tktatt_/)

      mockWorkflowRun.mockResolvedValueOnce({
        result: {
          id: "tktmsg_1",
          sender_id: "usr_1",
          sender_type: "user",
          message: "پاسخ پشتیبانی",
          metadata: { sender_name: "Ali Rezaei" },
        },
      })
      const mockUserService = {
        retrieveUser: jest.fn().mockResolvedValue({
          id: "usr_1",
          first_name: "Ali",
          last_name: "Rezaei",
        }),
      }
      const msgReq: any = {
        params: { id: "tkt_1" },
        auth_context: { actor_id: "usr_1" },
        body: {
          message: "پاسخ پشتیبانی",
          attachment_ids: [uploadedPayload.attachment_id],
        },
        scope: {
          resolve: jest.fn((key) => {
            if (key === Modules.USER) return mockUserService
            return null
          }),
        },
      }
      const msgRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await postTicketMessage(msgReq, msgRes)

      expect(msgRes.status).toHaveBeenCalledWith(201)
      expect(msgRes.json).toHaveBeenCalledWith({
        message: expect.objectContaining({
          sender_type: "admin",
          sender_id: "usr_1",
          sender_name: "Ali Rezaei",
        }),
      })
    })

    it("normalizes status and priority case-insensitively and supports unassigning with user_id=null", async () => {
      mockWorkflowRun.mockResolvedValue({ result: { id: "tkt_1" } })
      const scope: any = { resolve: jest.fn() }
      const res: any = { json: jest.fn().mockReturnThis() }

      await updateTicketStatus(
        {
          params: { id: "tkt_1" },
          auth_context: { actor_id: "usr_1" },
          body: { status: "WAITING_ON_CUSTOMER" },
          scope,
        } as any,
        res
      )
      expect(mockWorkflowRun).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ status: "waiting_for_customer" }),
        })
      )

      await updateTicketPriority(
        {
          params: { id: "tkt_1" },
          auth_context: { actor_id: "usr_1" },
          body: { priority: "MEDIUM" },
          scope,
        } as any,
        res
      )
      expect(mockWorkflowRun).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ priority: "normal" }),
        })
      )

      await assignTicket(
        {
          params: { id: "tkt_1" },
          auth_context: { actor_id: "usr_1" },
          body: { user_id: null },
          scope,
        } as any,
        res
      )
      expect(mockWorkflowRun).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ assigned_to: null }),
        })
      )
    })
  })

  describe("GET /admin/orders Default Sorting", () => {
    it("defaults order to created_at DESC when order query param is omitted", async () => {
      mockWorkflowRun.mockResolvedValueOnce({
        result: { rows: [], metadata: { count: 0, skip: 0, take: 15 } },
      })
      const req: any = {
        filterableFields: {},
        queryConfig: { fields: ["id"], pagination: { skip: 0, take: 15 } },
        scope: { resolve: jest.fn() },
      }
      const res: any = { json: jest.fn().mockReturnThis() }

      await listAdminOrders(req, res)

      expect(mockWorkflowRun).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            variables: expect.objectContaining({
              order: { created_at: "DESC" },
            }),
          }),
        })
      )
    })
  })

  describe("Campaigns Metadata Persistence, Store Tickets, Free-Shipping Limits & Store Product Inventory Default", () => {
    it("persists and exposes product_ids, min_purchase_amount, max_purchase_amount, and is_active on POST/PATCH /admin/campaigns", async () => {
      let persistedCampaign: any = {
        id: "procamp_1",
        name: "کمپین زمستانی",
        campaign_identifier: "WINTER",
        metadata: null,
      }
      mockWorkflowRun.mockImplementationOnce(async ({ input }: any) => {
        persistedCampaign = {
          ...persistedCampaign,
          ...input.campaignsData[0],
        }
        return { result: [persistedCampaign] }
      })
      const mockRemoteQuery = jest
        .fn()
        .mockImplementation(async () => [persistedCampaign])

      const createReq: any = {
        validatedBody: {
          name: "کمپین زمستانی",
          campaign_identifier: "WINTER",
          product_ids: ["prod_1", "prod_2"],
          min_purchase_amount: 1000000,
          max_purchase_amount: 5000000,
          is_active: true,
        },
        queryConfig: { fields: ["id", "name", "metadata"] },
        scope: {
          resolve: jest.fn((key) =>
            key === ContainerRegistrationKeys.REMOTE_QUERY ? mockRemoteQuery : null
          ),
        },
      }
      const createRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await createCampaign(createReq, createRes)

      expect(createRes.json).toHaveBeenCalledWith({
        campaign: expect.objectContaining({
          id: "procamp_1",
          product_ids: ["prod_1", "prod_2"],
          min_purchase_amount: 1000000,
          max_purchase_amount: 5000000,
          is_active: true,
        }),
      })

      mockWorkflowRun.mockImplementationOnce(async ({ input }: any) => {
        persistedCampaign = {
          ...persistedCampaign,
          ...input.campaignsData[0],
        }
        return { result: [persistedCampaign] }
      })
      const patchRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      await patchCampaign(
        {
          params: { id: "procamp_1" },
          validatedBody: { is_active: false },
          queryConfig: { fields: ["id", "name", "metadata"] },
          scope: createReq.scope,
        } as any,
        patchRes
      )

      expect(patchRes.json).toHaveBeenCalledWith({
        campaign: expect.objectContaining({
          id: "procamp_1",
          product_ids: ["prod_1", "prod_2"],
          is_active: false,
        }),
      })
    })

    it("enforces max_purchase_amount, usage_limit, and category/campaign scopes on GET /store/free-shipping-rules/active", async () => {
      const mockPromotionService = {
        listFreeShippingRules: jest.fn().mockResolvedValue([
          {
            id: "fsr_exhausted",
            title: "قانون تکمیل ظرفیت",
            scope: "store",
            min_purchase_amount: 100000,
            is_active: true,
            metadata: { usage_limit: 5, used_count: 5 },
          },
          {
            id: "fsr_max_cap",
            title: "ارسال رایگان با سقف خرید",
            scope: "categories",
            category_ids: ["cat_tools"],
            min_purchase_amount: 500000,
            is_active: true,
            metadata: { max_purchase_amount: 2000000, usage_limit: 10, used_count: 2 },
          },
        ]),
      }

      const cartOverMax = {
        id: "cart_cap",
        item_total: 2500000,
        items: [
          {
            id: "li_1",
            product_id: "prod_1",
            product: { categories: [{ id: "cat_tools" }] },
          },
        ],
      }
      const req: any = {
        query: { cart_id: "cart_cap" },
        scope: {
          resolve: jest.fn((key) => {
            if (key === Modules.PROMOTION) return mockPromotionService
            if (key === ContainerRegistrationKeys.REMOTE_QUERY) {
              return async () => [cartOverMax]
            }
            return null
          }),
        },
      }
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }

      await getActiveFreeShipping(req, res)
      // Exhausted rule is excluded; cartOverMax exceeds max_purchase_amount=2000000 -> not eligible
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          free_shipping: expect.objectContaining({
            has_active_rule: true,
            is_eligible: false,
            rule_title: "ارسال رایگان با سقف خرید",
          }),
          rules: [expect.objectContaining({ id: "fsr_max_cap" })],
        })
      )
    })

    it("supports is_internal alias, reads metadata.name on admin ticket replies, and maps sender_type=admin on store ticket detail", async () => {
      mockWorkflowRun.mockResolvedValueOnce({
        result: {
          id: "tktmsg_int",
          sender_id: "usr_meta",
          sender_type: "user",
          message: "یادداشت داخلی",
          is_internal_note: true,
          metadata: { sender_name: "مدیر پشتیبانی" },
        },
      })
      const mockUserService = {
        retrieveUser: jest.fn().mockResolvedValue({
          id: "usr_meta",
          metadata: { name: "مدیر پشتیبانی" },
        }),
      }
      const msgRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }
      await postTicketMessage(
        {
          params: { id: "tkt_1" },
          auth_context: { actor_id: "usr_meta" },
          body: { message: "یادداشت داخلی", is_internal: true },
          scope: {
            resolve: jest.fn((key) =>
              key === Modules.USER ? mockUserService : null
            ),
          },
        } as any,
        msgRes
      )

      expect(mockWorkflowRun).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            is_internal_note: true,
            metadata: expect.objectContaining({ sender_name: "مدیر پشتیبانی" }),
          }),
        })
      )
      expect(msgRes.json).toHaveBeenCalledWith({
        message: expect.objectContaining({
          sender_type: "admin",
          sender_name: "مدیر پشتیبانی",
          is_internal: true,
          is_internal_note: true,
        }),
      })

      const mockTicketService = {
        listTickets: jest.fn().mockResolvedValue([
          {
            id: "tkt_1",
            user_id: "cust_1",
            messages: [
              {
                id: "m_1",
                ticket_id: "tkt_1",
                sender_id: "usr_meta",
                sender_type: "user",
                message: "پاسخ ادمین",
                is_internal_note: false,
                metadata: { sender_name: "مدیر پشتیبانی" },
                created_at: "2026-11-27T10:00:00Z",
              },
            ],
          },
        ]),
      }
      const storeRes: any = { json: jest.fn() }
      await getStoreTicketDetail(
        {
          params: { id: "tkt_1" },
          auth_context: { actor_id: "cust_1" },
          scope: {
            resolve: jest.fn((key) =>
              key === Modules.TICKET ? mockTicketService : null
            ),
          },
        } as any,
        storeRes
      )
      expect(storeRes.json).toHaveBeenCalledWith({
        ticket: expect.objectContaining({
          messages: [
            expect.objectContaining({
              sender_type: "admin",
              sender_name: "مدیر پشتیبانی",
            }),
          ],
        }),
      })
    })

    it("includes variants.inventory_quantity in defaultStoreProductFields", () => {
      expect(defaultStoreProductFields).toContain("variants.inventory_quantity")
    })
  })
})
