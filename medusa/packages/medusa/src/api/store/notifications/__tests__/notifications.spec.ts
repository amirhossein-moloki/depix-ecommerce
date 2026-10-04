import { GET as getNotifications } from "../route"
import { POST as markAllAsRead } from "../read-all/route"
import { GET as getUnreadCount } from "../unread-count/route"
import { GET as getNotification } from "../[id]/route"
import { POST as markAsRead } from "../[id]/read/route"
import configurableNotifications from "../../../../subscribers/configurable-notifications"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Backend In-App Notification Center API & Workflows", () => {
  let mockNotifications: any[]

  beforeEach(() => {
    mockNotifications = [
      {
        id: "noti_1",
        to: "customerA@example.com",
        channel: "in-app",
        template: "order-placed",
        trigger_type: "order.placed",
        resource_id: "ord_1",
        resource_type: "order",
        receiver_id: "cus_A",
        status: "success",
        read_at: null,
        created_at: new Date("2025-01-01T10:00:00Z"),
        data: { title: "Order Placed", order_id: "ord_1" },
      },
      {
        id: "noti_2",
        to: "customerA@example.com",
        channel: "in-app",
        template: "shipment-created",
        trigger_type: "fulfillment.created",
        resource_id: "ful_1",
        resource_type: "fulfillment",
        receiver_id: "cus_A",
        status: "success",
        read_at: null,
        created_at: new Date("2025-01-02T10:00:00Z"),
        data: { title: "Shipment Created", fulfillment_id: "ful_1" },
      },
      {
        id: "noti_3",
        to: "customerB@example.com",
        channel: "in-app",
        template: "order-placed",
        trigger_type: "order.placed",
        resource_id: "ord_2",
        resource_type: "order",
        receiver_id: "cus_B",
        status: "success",
        read_at: null,
        created_at: new Date("2025-01-03T10:00:00Z"),
        data: { title: "Order Placed", order_id: "ord_2" },
      },
    ]
  })

  describe("Store API Authentication & Authorization", () => {
    it("should reject unauthenticated list request with 401", async () => {
      const req: any = { auth_context: null }
      const res: any = {}

      await expect(getNotifications(req, res)).rejects.toThrow(
        "Authentication required to access notifications"
      )
    })

    it("should reject unauthenticated unread count request with 401", async () => {
      const req: any = { auth_context: null }
      const res: any = {}

      await expect(getUnreadCount(req, res)).rejects.toThrow(
        "Authentication required to get unread notification count"
      )
    })

    it("should isolate customer notifications and return only Customer A notifications", async () => {
      const mockNotificationService = {
        listAndCountNotifications: jest.fn().mockImplementation((filters) => {
          const filtered = mockNotifications.filter(
            (n) => n.receiver_id === filters.receiver_id
          )
          return Promise.resolve([filtered, filtered.length])
        }),
        getUnreadCount: jest.fn().mockImplementation((receiverId) => {
          const unread = mockNotifications.filter(
            (n) => n.receiver_id === receiverId && !n.read_at
          )
          return Promise.resolve(unread.length)
        }),
      }

      const req: any = {
        auth_context: { actor_id: "cus_A" },
        validatedQuery: { limit: 20, offset: 0 },
        scope: { resolve: jest.fn().mockReturnValue(mockNotificationService) },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getNotifications(req, res)

      expect(mockNotificationService.listAndCountNotifications).toHaveBeenCalledWith(
        { receiver_id: "cus_A" },
        expect.objectContaining({ skip: 0, take: 20 })
      )
      expect(jsonMock).toHaveBeenCalledWith({
        notifications: expect.arrayContaining([
          expect.objectContaining({ id: "noti_1", receiver_id: "cus_A" }),
          expect.objectContaining({ id: "noti_2", receiver_id: "cus_A" }),
        ]),
        count: 2,
        limit: 20,
        offset: 0,
        unread_count: 2,
      })
    })

    it("should reject customer A accessing customer B notification with 404", async () => {
      const mockNotificationService = {
        listNotifications: jest.fn().mockImplementation((filters) => {
          const found = mockNotifications.filter(
            (n) => n.id === filters.id && n.receiver_id === filters.receiver_id
          )
          return Promise.resolve(found)
        }),
      }

      const req: any = {
        params: { id: "noti_3" },
        auth_context: { actor_id: "cus_A" },
        scope: { resolve: jest.fn().mockReturnValue(mockNotificationService) },
      }

      const res: any = {}

      await expect(getNotification(req, res)).rejects.toThrow(
        "Notification with id: noti_3 was not found"
      )
    })
  })

  describe("Read State & Mark as Read Workflows", () => {
    it("should mark single notification as read for authenticated customer", async () => {
      const updatedNoti = { ...mockNotifications[0], read_at: new Date() }
      const mockNotificationService = {
        listNotifications: jest.fn().mockResolvedValue([mockNotifications[0]]),
        markAsRead: jest.fn().mockResolvedValue([updatedNoti]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
      })

      const req: any = {
        params: { id: "noti_1" },
        auth_context: { actor_id: "cus_A" },
        scope: container,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await markAsRead(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        notification: expect.objectContaining({
          id: "noti_1",
          read_at: expect.anything(),
        }),
      })
    })

    it("should mark all notifications as read for authenticated customer safely", async () => {
      const mockNotificationService = {
        markAllAsRead: jest.fn().mockResolvedValue({ count: 2 }),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
      })

      const req: any = {
        auth_context: { actor_id: "cus_A" },
        scope: container,
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock, json: jsonMock }

      await markAllAsRead(req, res)

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith("cus_A")
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        count: 2,
      })
    })

    it("should calculate unread count efficiently via GET /store/notifications/unread-count", async () => {
      const mockNotificationService = {
        getUnreadCount: jest.fn().mockResolvedValue(2),
      }

      const req: any = {
        auth_context: { actor_id: "cus_A" },
        scope: { resolve: jest.fn().mockReturnValue(mockNotificationService) },
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock, json: jsonMock }

      await getUnreadCount(req, res)

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith("cus_A")
      expect(jsonMock).toHaveBeenCalledWith({ count: 2 })
    })
  })

  describe("Pagination & Filtering", () => {
    it("should support filtering for unread notifications only", async () => {
      const mockNotificationService = {
        listAndCountNotifications: jest.fn().mockImplementation((filters) => {
          let filtered = mockNotifications.filter(
            (n) => n.receiver_id === filters.receiver_id
          )
          if (filters.read_at === null) {
            filtered = filtered.filter((n) => n.read_at === null)
          }
          return Promise.resolve([filtered, filtered.length])
        }),
        getUnreadCount: jest.fn().mockResolvedValue(2),
      }

      const req: any = {
        auth_context: { actor_id: "cus_A" },
        validatedQuery: { limit: 10, offset: 0, unread_only: true },
        scope: { resolve: jest.fn().mockReturnValue(mockNotificationService) },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getNotifications(req, res)

      expect(mockNotificationService.listAndCountNotifications).toHaveBeenCalledWith(
        { receiver_id: "cus_A", read_at: null },
        expect.objectContaining({ skip: 0, take: 10 })
      )
    })
  })

  describe("Domain Event Subscriber Integration", () => {
    it("should create in-app notification when domain event order.placed fires", async () => {
      const mockNotificationService = {
        createNotifications: jest.fn().mockResolvedValue([{ id: "noti_new" }]),
      }

      const mockLogger = { error: jest.fn() }

      const container = createMedusaContainer()
      container.register({
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
        logger: asValue(mockLogger),
      })

      const event = {
        name: "order.placed",
        data: {
          order: {
            id: "ord_100",
            customer_id: "cus_100",
            email: "cus100@example.com",
          },
        },
      }

      await configurableNotifications({ event, container } as any)

      expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: "in-app",
          trigger_type: "order.placed",
          resource_id: "ord_100",
          resource_type: "order",
          receiver_id: "cus_100",
          idempotency_key: "in-app_order.placed_ord_100_cus_100",
          data: expect.objectContaining({
            title: "Order Placed",
            order_id: "ord_100",
          }),
        })
      )
    })
  })
})
