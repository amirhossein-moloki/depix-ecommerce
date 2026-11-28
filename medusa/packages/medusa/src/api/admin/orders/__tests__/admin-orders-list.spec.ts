const mockWorkflowRun = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  getOrdersListWorkflow: jest.fn(() => ({ run: mockWorkflowRun })),
}))

import { validateAndTransformQuery } from "@medusajs/framework/http"
import { GET as listAdminOrders } from "../route"
import {
  defaultAdminOrderFields,
  defaultAdminRetrieveOrderFields,
  listTransformQueryConfig,
  retrieveTransformQueryConfig,
} from "../query-config"
import {
  AdminGetOrdersOrderParams,
  AdminGetOrdersParams,
} from "../validators"

describe("Admin Orders List & Detail Default Query Fields", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const runQueryMiddleware = async (
    middleware: ReturnType<typeof validateAndTransformQuery>,
    query: Record<string, any>
  ) => {
    const req: any = {
      query,
      allowed: [],
    }
    const res: any = {}

    await new Promise<void>((resolve, reject) => {
      middleware(req, res, (err?: unknown) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })

    return req
  }

  it("includes customer, address, shipping, payment, and total fields in defaultAdminOrderFields", () => {
    expect(defaultAdminOrderFields).toEqual(
      expect.arrayContaining([
        "customer_id",
        "email",
        "currency_code",
        "region_id",
        "sales_channel_id",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "total",
        "*items",
        "*shipping_address",
        "*billing_address",
        "*shipping_methods",
        "*shipping_methods.tax_lines",
        "*shipping_methods.adjustments",
        "*payment_collections",
      ])
    )
  })

  it("includes list defaults plus detail-only fields in defaultAdminRetrieveOrderFields without duplicates", () => {
    expect(defaultAdminRetrieveOrderFields).toEqual(
      expect.arrayContaining([
        ...defaultAdminOrderFields,
        "*credit_lines",
        "*items.tax_lines",
        "*items.adjustments",
        "*items.variant",
        "*items.variant.product",
        "*items.detail",
        "*payment_collections.payments",
        "*payment_collections.payments.refunds",
        "*payment_collections.payments.captures",
      ])
    )

    expect(new Set(defaultAdminRetrieveOrderFields).size).toBe(
      defaultAdminRetrieveOrderFields.length
    )
  })

  it("passes expanded default fields through validateAndTransformQuery and GET /admin/orders", async () => {
    const listMiddleware = validateAndTransformQuery(
      AdminGetOrdersParams,
      listTransformQueryConfig
    )
    const req = await runQueryMiddleware(listMiddleware, {})
    req.scope = { resolve: jest.fn() }

    expect(req.queryConfig.fields).toEqual(
      expect.arrayContaining([
        "customer_id",
        "email",
        "currency_code",
        "region_id",
        "sales_channel_id",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "total",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "shipping_methods.tax_lines.*",
        "shipping_methods.adjustments.*",
        "payment_collections.*",
      ])
    )

    const sampleOrder = {
      id: "order_1",
      display_id: 101,
      customer_id: "cus_1",
      email: "buyer@example.com",
      currency_code: "irr",
      region_id: "reg_ir",
      sales_channel_id: "sc_default",
      status: "pending",
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      subtotal: 1000000,
      discount_total: 100000,
      shipping_total: 50000,
      tax_total: 0,
      total: 950000,
      shipping_address: {
        id: "oaddr_ship_1",
        first_name: "Ali",
        last_name: "Rezaei",
        phone: "09123456789",
        city: "Tehran",
        province: "Tehran",
        address_1: "Valiasr St",
        postal_code: "1234567890",
        country_code: "ir",
      },
      billing_address: {
        id: "oaddr_bill_1",
        first_name: "Ali",
        last_name: "Rezaei",
        city: "Tehran",
        address_1: "Valiasr St",
        country_code: "ir",
      },
      shipping_methods: [
        {
          id: "ordsm_1",
          name: "پست پیشتاز",
          amount: 50000,
          shipping_option_id: "so_postex",
        },
      ],
      payment_collections: [
        {
          id: "paycol_1",
          status: "completed",
          amount: 950000,
          captured_amount: 950000,
        },
      ],
      metadata: {
        fulfillment_status: "shipped",
        promotions: [{ id: "promo_1", code: "OFF10", type: "percentage", value: 10 }],
      },
    }

    mockWorkflowRun.mockResolvedValueOnce({
      result: {
        rows: [sampleOrder],
        metadata: { count: 1, skip: 0, take: 15 },
      },
    })

    const res: any = {
      json: jest.fn().mockReturnThis(),
    }

    await listAdminOrders(req, res)

    expect(mockWorkflowRun).toHaveBeenCalledWith({
      input: {
        fields: req.queryConfig.fields,
        variables: expect.objectContaining({
          filters: expect.objectContaining({
            is_draft_order: false,
          }),
          order: { created_at: "DESC" },
          skip: 0,
          take: 15,
        }),
      },
    })

    expect(res.json).toHaveBeenCalledWith({
      orders: [
        expect.objectContaining({
          id: "order_1",
          customer_id: "cus_1",
          email: "buyer@example.com",
          currency_code: "irr",
          shipping_address: sampleOrder.shipping_address,
          billing_address: sampleOrder.billing_address,
          shipping_methods: sampleOrder.shipping_methods,
          payment_collections: sampleOrder.payment_collections,
          payment_status: "captured",
          fulfillment_status: "shipped",
          promotions: sampleOrder.metadata.promotions,
        }),
      ],
      count: 1,
      offset: 0,
      limit: 15,
    })
  })

  it("supports replacing defaults with ?fields=id,total and appending with ?fields=+customer.*", async () => {
    const listMiddleware = validateAndTransformQuery(
      AdminGetOrdersParams,
      listTransformQueryConfig
    )

    const replacedReq = await runQueryMiddleware(listMiddleware, {
      fields: "id,total",
    })
    expect(replacedReq.queryConfig.fields).toEqual(["id", "total"])

    const appendedReq = await runQueryMiddleware(listMiddleware, {
      fields: "+customer.*",
    })
    expect(appendedReq.queryConfig.fields).toEqual(
      expect.arrayContaining([
        "customer_id",
        "email",
        "currency_code",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "payment_collections.*",
        "customer.*",
      ])
    )
  })

  it("includes customer, email, currency, addresses, shipping methods, and payment collections on GET /admin/orders/:id", async () => {
    const detailMiddleware = validateAndTransformQuery(
      AdminGetOrdersOrderParams,
      retrieveTransformQueryConfig
    )
    const req = await runQueryMiddleware(detailMiddleware, {})

    expect(req.queryConfig.fields).toEqual(
      expect.arrayContaining([
        "customer_id",
        "email",
        "currency_code",
        "region_id",
        "sales_channel_id",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "payment_collections.*",
        "payment_collections.payments.*",
      ])
    )
  })

  describe("customer_id query filter", () => {
    it("passes single customer_id filter through GET /admin/orders", async () => {
      const listMiddleware = validateAndTransformQuery(
        AdminGetOrdersParams,
        listTransformQueryConfig
      )
      const req = await runQueryMiddleware(listMiddleware, {
        customer_id: "cus_123",
      })
      req.scope = { resolve: jest.fn() }

      mockWorkflowRun.mockResolvedValueOnce({
        result: { rows: [], metadata: { count: 0, skip: 0, take: 15 } },
      })
      const res: any = { json: jest.fn().mockReturnThis() }

      await listAdminOrders(req, res)

      expect(mockWorkflowRun).toHaveBeenCalledWith({
        input: {
          fields: req.queryConfig.fields,
          variables: expect.objectContaining({
            filters: expect.objectContaining({
              customer_id: "cus_123",
              is_draft_order: false,
            }),
          }),
        },
      })
    })

    it("passes array customer_id filters through GET /admin/orders", async () => {
      const listMiddleware = validateAndTransformQuery(
        AdminGetOrdersParams,
        listTransformQueryConfig
      )
      const req = await runQueryMiddleware(listMiddleware, {
        customer_id: ["cus_1", "cus_2"],
      })
      req.scope = { resolve: jest.fn() }

      mockWorkflowRun.mockResolvedValueOnce({
        result: { rows: [], metadata: { count: 0, skip: 0, take: 15 } },
      })
      const res: any = { json: jest.fn().mockReturnThis() }

      await listAdminOrders(req, res)

      expect(mockWorkflowRun).toHaveBeenCalledWith({
        input: {
          fields: req.queryConfig.fields,
          variables: expect.objectContaining({
            filters: expect.objectContaining({
              customer_id: ["cus_1", "cus_2"],
              is_draft_order: false,
            }),
          }),
        },
      })
    })

    it("supports operator map on customer_id filter", async () => {
      const listMiddleware = validateAndTransformQuery(
        AdminGetOrdersParams,
        listTransformQueryConfig
      )
      const req = await runQueryMiddleware(listMiddleware, {
        customer_id: { $eq: "cus_123" },
      })
      req.scope = { resolve: jest.fn() }

      mockWorkflowRun.mockResolvedValueOnce({
        result: { rows: [], metadata: { count: 0, skip: 0, take: 15 } },
      })
      const res: any = { json: jest.fn().mockReturnThis() }

      await listAdminOrders(req, res)

      expect(mockWorkflowRun).toHaveBeenCalledWith({
        input: {
          fields: req.queryConfig.fields,
          variables: expect.objectContaining({
            filters: expect.objectContaining({
              customer_id: { $eq: "cus_123" },
              is_draft_order: false,
            }),
          }),
        },
      })
    })

    it("ignores blank or whitespace-only customer_id filters", async () => {
      const listMiddleware = validateAndTransformQuery(
        AdminGetOrdersParams,
        listTransformQueryConfig
      )
      const req = await runQueryMiddleware(listMiddleware, {
        customer_id: "   ",
      })
      req.scope = { resolve: jest.fn() }

      expect(req.filterableFields).not.toHaveProperty("customer_id")

      mockWorkflowRun.mockResolvedValueOnce({
        result: { rows: [], metadata: { count: 0, skip: 0, take: 15 } },
      })
      const res: any = { json: jest.fn().mockReturnThis() }

      await listAdminOrders(req, res)

      expect(mockWorkflowRun).toHaveBeenCalledWith({
        input: {
          fields: req.queryConfig.fields,
          variables: expect.objectContaining({
            filters: {
              is_draft_order: false,
            },
          }),
        },
      })
    })
  })
})
