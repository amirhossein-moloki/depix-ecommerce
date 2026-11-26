import { Modules, OrderStatus } from "@medusajs/framework/utils"
import { POST as adminUpdateOrderStatus } from "../../../admin/orders/[id]/status/route"
import { applyOrderStatusMetadata } from "../../../utils/order-status"
import { POST as storeCancelOrder } from "../[id]/cancel/route"
import {
  allowedStoreOrderExtraFields,
  defaultStoreOrderFields,
  defaultStoreRetrieveOrderFields,
  retrieveTransformQueryConfig,
} from "../query-config"

const mockCancelRun = jest.fn()
const mockCompleteRun = jest.fn()
const mockGetDetailRun = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  ...jest.requireActual("@medusajs/core-flows"),
  cancelOrderWorkflow: jest.fn(() => ({ run: mockCancelRun })),
  completeOrderWorkflow: jest.fn(() => ({ run: mockCompleteRun })),
  getOrderDetailWorkflow: jest.fn(() => ({ run: mockGetDetailRun })),
}))

describe("Orders Metadata, Admin Status Transitions & Customer Cancellation", () => {
  const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    return { res: { json, status } as any, json, status }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Query config & metadata hydration", () => {
    it("includes metadata and customer_id in default store order retrieve & list configs", () => {
      expect(defaultStoreOrderFields).toContain("metadata")
      expect(defaultStoreOrderFields).toContain("customer_id")
      expect(defaultStoreRetrieveOrderFields).toContain("metadata")
      expect(defaultStoreRetrieveOrderFields).toContain("customer_id")
      expect(allowedStoreOrderExtraFields).toContain("metadata")
      expect(retrieveTransformQueryConfig.allowed).toContain("metadata")
      expect(retrieveTransformQueryConfig.allowed).toContain("customer_id")
    })

    it("applies metadata.fulfillment_status without overriding active real fulfillment statuses", () => {
      expect(
        applyOrderStatusMetadata({
          id: "order_1",
          fulfillment_status: "not_fulfilled",
          metadata: { fulfillment_status: "shipped" },
        }).fulfillment_status
      ).toBe("shipped")

      expect(
        applyOrderStatusMetadata({
          id: "order_2",
          fulfillment_status: "delivered",
          metadata: { fulfillment_status: "fulfilled" },
        }).fulfillment_status
      ).toBe("delivered")

      expect(
        applyOrderStatusMetadata({
          id: "order_3",
          fulfillment_status: "not_fulfilled",
          metadata: { fulfillment_status: "invalid_status" },
        }).fulfillment_status
      ).toBe("not_fulfilled")
    })
  })

  describe("POST /admin/orders/:id/status", () => {
    it("transitions confirmed -> processing -> shipped -> delivered -> completed and syncs status_history", async () => {
      let currentOrder: any = {
        id: "order_admin_1",
        status: OrderStatus.PENDING,
        fulfillment_status: "not_fulfilled",
        metadata: { existing_key: "keep_me" },
      }

      const orderService = {
        retrieveOrder: jest.fn().mockImplementation(() => Promise.resolve({ ...currentOrder })),
        updateOrders: jest.fn().mockImplementation((_id: string, patch: any) => {
          currentOrder = {
            ...currentOrder,
            ...(patch.status ? { status: patch.status } : {}),
            ...(patch.metadata ? { metadata: patch.metadata } : {}),
          }
          return Promise.resolve(currentOrder)
        }),
      }

      mockCompleteRun.mockImplementation(async () => {
        currentOrder.status = OrderStatus.COMPLETED
        return { result: [{ ...currentOrder }] }
      })
      mockCancelRun.mockImplementation(async () => {
        currentOrder.status = OrderStatus.CANCELED
        return { result: { ...currentOrder } }
      })
      mockGetDetailRun.mockImplementation(async () => ({
        result: { ...currentOrder, fulfillment_status: "not_fulfilled" },
      }))

      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === Modules.ORDER) return orderService
          throw new Error(`Unexpected ${key}`)
        }),
      } as any

      // confirmed
      {
        const { res, status, json } = makeRes()
        await adminUpdateOrderStatus(
          {
            params: { id: "order_admin_1" },
            validatedBody: { status: "confirmed", note: "سفارش تایید شد" },
            auth_context: { actor_id: "usr_admin_1" },
            queryConfig: { fields: ["id", "status", "metadata"] },
            scope,
          } as any,
          res
        )
        expect(status).toHaveBeenCalledWith(200)
        const returned = json.mock.calls[0][0].order
        expect(returned.status).toBe(OrderStatus.PENDING)
        expect(returned.fulfillment_status).toBe("not_fulfilled")
        expect(returned.metadata).toMatchObject({
          existing_key: "keep_me",
          order_status: "confirmed",
          fulfillment_status: "not_fulfilled",
          status_note: "سفارش تایید شد",
        })
        expect(returned.metadata.status_history).toHaveLength(1)
      }

      // processing
      {
        const { res, status, json } = makeRes()
        await adminUpdateOrderStatus(
          {
            params: { id: "order_admin_1" },
            validatedBody: { status: "processing" },
            auth_context: { actor_id: "usr_admin_1" },
            queryConfig: { fields: ["id", "status", "metadata"] },
            scope,
          } as any,
          res
        )
        expect(status).toHaveBeenCalledWith(200)
        const returned = json.mock.calls[0][0].order
        expect(returned.metadata.order_status).toBe("processing")
        expect(returned.fulfillment_status).toBe("fulfilled")
      }

      // shipped
      {
        const { res, status, json } = makeRes()
        await adminUpdateOrderStatus(
          {
            params: { id: "order_admin_1" },
            validatedBody: { status: "shipped", tracking_number: "TRK-9988" },
            auth_context: { actor_id: "usr_admin_1" },
            queryConfig: { fields: ["id", "status", "metadata"] },
            scope,
          } as any,
          res
        )
        expect(status).toHaveBeenCalledWith(200)
        const returned = json.mock.calls[0][0].order
        expect(returned.metadata.order_status).toBe("shipped")
        expect(returned.metadata.tracking_number).toBe("TRK-9988")
        expect(returned.fulfillment_status).toBe("shipped")
      }

      // delivered -> triggers completeOrderWorkflow
      {
        const { res, status, json } = makeRes()
        await adminUpdateOrderStatus(
          {
            params: { id: "order_admin_1" },
            validatedBody: { status: "delivered" },
            auth_context: { actor_id: "usr_admin_1" },
            queryConfig: { fields: ["id", "status", "metadata"] },
            scope,
          } as any,
          res
        )
        expect(status).toHaveBeenCalledWith(200)
        expect(mockCompleteRun).toHaveBeenCalledWith({
          input: { orderIds: ["order_admin_1"] },
        })
        const returned = json.mock.calls[0][0].order
        expect(returned.status).toBe(OrderStatus.COMPLETED)
        expect(returned.fulfillment_status).toBe("delivered")
        expect(returned.metadata.status_history).toHaveLength(4)
      }
    })

    it("runs cancelOrderWorkflow when transitioning to canceled/cancelled", async () => {
      let currentOrder: any = {
        id: "order_admin_cancel",
        status: OrderStatus.PENDING,
        metadata: {},
      }
      const orderService = {
        retrieveOrder: jest.fn().mockImplementation(() => Promise.resolve({ ...currentOrder })),
        updateOrders: jest.fn().mockImplementation((_id: string, patch: any) => {
          currentOrder = { ...currentOrder, ...patch }
          return Promise.resolve(currentOrder)
        }),
      }
      mockCancelRun.mockImplementation(async () => {
        currentOrder.status = OrderStatus.CANCELED
        return { result: currentOrder }
      })
      mockGetDetailRun.mockImplementation(async () => ({
        result: { ...currentOrder },
      }))

      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === Modules.ORDER) return orderService
          throw new Error(`Unexpected ${key}`)
        }),
      } as any

      const { res, status, json } = makeRes()
      await adminUpdateOrderStatus(
        {
          params: { id: "order_admin_cancel" },
          validatedBody: { status: "cancelled" },
          auth_context: { actor_id: "usr_admin_1" },
          queryConfig: { fields: ["id", "status", "metadata"] },
          scope,
        } as any,
        res
      )

      expect(status).toHaveBeenCalledWith(200)
      expect(mockCancelRun).toHaveBeenCalledWith({
        input: { order_id: "order_admin_cancel", canceled_by: "usr_admin_1" },
      })
      expect(json.mock.calls[0][0].order.metadata.order_status).toBe("canceled")
      expect(json.mock.calls[0][0].order.fulfillment_status).toBe("canceled")
    })
  })

  describe("POST /store/orders/:id/cancel", () => {
    it.each(["pending", "confirmed", "processing"])(
      "allows order owner to cancel an order in %s status",
      async (metaStatus) => {
        let currentOrder: any = {
          id: "order_cust_1",
          customer_id: "cus_1",
          status: OrderStatus.PENDING,
          fulfillment_status: "not_fulfilled",
          metadata: { order_status: metaStatus, keep: "yes" },
          fulfillments: [],
        }

        const orderService = {
          retrieveOrder: jest.fn().mockImplementation(() => Promise.resolve({ ...currentOrder })),
          updateOrders: jest.fn().mockImplementation((_id: string, patch: any) => {
            currentOrder = { ...currentOrder, ...patch }
            return Promise.resolve(currentOrder)
          }),
        }

        mockCancelRun.mockImplementation(async () => {
          currentOrder.status = OrderStatus.CANCELED
          return { result: currentOrder }
        })
        mockGetDetailRun.mockImplementation(async () => ({
          result: { ...currentOrder },
        }))

        const scope = {
          resolve: jest.fn((key: string) => {
            if (key === Modules.ORDER) return orderService
            throw new Error(`Unexpected ${key}`)
          }),
        } as any

        const { res, status, json } = makeRes()
        await storeCancelOrder(
          {
            params: { id: "order_cust_1" },
            validatedBody: { reason: "تغییر نظر" },
            auth_context: { actor_id: "cus_1" },
            queryConfig: { fields: ["id", "status", "metadata"] },
            scope,
          } as any,
          res
        )

        expect(status).toHaveBeenCalledWith(200)
        expect(mockCancelRun).toHaveBeenCalledWith({
          input: { order_id: "order_cust_1", canceled_by: "cus_1" },
        })
        const returned = json.mock.calls[0][0].order
        expect(returned.status).toBe(OrderStatus.CANCELED)
        expect(returned.metadata).toMatchObject({
          keep: "yes",
          order_status: "canceled",
          fulfillment_status: "canceled",
          canceled_by: "cus_1",
          canceled_by_actor: "customer",
          cancel_reason: "تغییر نظر",
        })
      }
    )

    it("rejects unauthenticated requests and orders owned by another customer", async () => {
      const orderService = {
        retrieveOrder: jest.fn(),
        updateOrders: jest.fn(),
      }
      mockGetDetailRun.mockResolvedValue({
        result: {
          id: "order_other",
          customer_id: "cus_owner",
          status: OrderStatus.PENDING,
          metadata: {},
          fulfillments: [],
        },
      })
      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === Modules.ORDER) return orderService
          throw new Error(`Unexpected ${key}`)
        }),
      } as any

      await expect(
        storeCancelOrder(
          {
            params: { id: "order_other" },
            validatedBody: {},
            auth_context: {},
            scope,
          } as any,
          makeRes().res
        )
      ).rejects.toThrow("احراز هویت برای لغو سفارش الزامی است.")

      await expect(
        storeCancelOrder(
          {
            params: { id: "order_other" },
            validatedBody: {},
            auth_context: { actor_id: "cus_attacker" },
            scope,
          } as any,
          makeRes().res
        )
      ).rejects.toThrow("سفارش مورد نظر یافت نشد.")

      expect(mockCancelRun).not.toHaveBeenCalled()
    })

    it.each([
      {
        label: "shipped metadata status",
        order: {
          id: "order_shipped",
          customer_id: "cus_1",
          status: OrderStatus.PENDING,
          fulfillment_status: "shipped",
          metadata: { order_status: "shipped", fulfillment_status: "shipped" },
          fulfillments: [],
        },
      },
      {
        label: "delivered metadata status",
        order: {
          id: "order_delivered",
          customer_id: "cus_1",
          status: OrderStatus.COMPLETED,
          fulfillment_status: "delivered",
          metadata: { order_status: "delivered", fulfillment_status: "delivered" },
          fulfillments: [],
        },
      },
      {
        label: "already completed order",
        order: {
          id: "order_completed",
          customer_id: "cus_1",
          status: OrderStatus.COMPLETED,
          metadata: {},
          fulfillments: [],
        },
      },
      {
        label: "already canceled order",
        order: {
          id: "order_canceled",
          customer_id: "cus_1",
          status: OrderStatus.CANCELED,
          metadata: { order_status: "canceled" },
          fulfillments: [],
        },
      },
      {
        label: "active non-canceled fulfillment",
        order: {
          id: "order_active_ful",
          customer_id: "cus_1",
          status: OrderStatus.PENDING,
          metadata: { order_status: "processing" },
          fulfillments: [{ id: "ful_1", canceled_at: null }],
        },
      },
    ])("rejects cancellation for $label", async ({ order }) => {
      mockGetDetailRun.mockResolvedValue({ result: order })
      const scope = {
        resolve: jest.fn((key: string) => {
          if (key === Modules.ORDER) return {}
          throw new Error(`Unexpected ${key}`)
        }),
      } as any

      await expect(
        storeCancelOrder(
          {
            params: { id: order.id },
            validatedBody: {},
            auth_context: { actor_id: "cus_1" },
            scope,
          } as any,
          makeRes().res
        )
      ).rejects.toThrow()

      expect(mockCancelRun).not.toHaveBeenCalled()
    })
  })
})
