import { POST as createProductStockAlert } from "../../products/[id]/stock-alerts/route"
import { POST as createStockAlert, GET as getStockAlerts } from "../route"
import { DELETE as cancelStockAlert } from "../[id]/route"
import { GET as adminGetStockAlerts } from "../../../admin/stock-alerts/route"
import { GET as adminGetStockAlert } from "../../../admin/stock-alerts/[id]/route"
import { createStockAlertWorkflow } from "../../../../../../core/core-flows/src/stock-alert/workflows/create-stock-alert"
import { cancelStockAlertWorkflow } from "../../../../../../core/core-flows/src/stock-alert/workflows/cancel-stock-alert"
import { processStockAvailabilityWorkflow } from "../../../../../../core/core-flows/src/stock-alert/workflows/process-stock-availability"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Stock Alert API, Workflows & Inventory Integration", () => {
  describe("Stock Alert Workflows & Validations", () => {
    it("should throw error if customer does not exist", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockRejectedValue(new Error("Not found")),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
      })

      const { errors } = await createStockAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_nonexistent",
            product_id: "prod_1",
            variant_id: "var_1",
            channel: "sms",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Customer with id cus_nonexistent not found"
      )
    })

    it("should throw error if product does not exist", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockRejectedValue(new Error("Not found")),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_nonexistent" }),
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
      })

      const { errors } = await createStockAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_nonexistent",
            variant_id: "var_1",
            channel: "sms",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Product with id prod_nonexistent not found"
      )
    })

    it("should throw error if variant does not belong to product", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_other" }),
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
      })

      const { errors } = await createStockAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_1",
            variant_id: "var_1",
            channel: "sms",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Product variant var_1 does not belong to product prod_1"
      )
    })

    it("should throw error if unsupported channel is requested", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue({}),
      })

      const { errors } = await createStockAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_1",
            variant_id: "var_1",
            channel: "unsupported_channel",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Unsupported notification channel: unsupported_channel"
      )
    })

    it("should create stock alert successfully", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[], 0]),
        createStockAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ id: "sta_1", ...data, status: "active" })
        ),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createStockAlertWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          channel: "sms",
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("sta_1")
      expect(result.customer_id).toBe("cus_1")
      expect(result.channel).toBe("sms")
      expect(result.status).toBe("active")
    })

    it("should return existing active alert on duplicate subscription request (idempotency)", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }
      const existingAlert = {
        id: "sta_existing",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        channel: "sms",
        status: "active",
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest
          .fn()
          .mockResolvedValue([[existingAlert], 1]),
        createStockAlerts: jest.fn(),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createStockAlertWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          channel: "sms",
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("sta_existing")
      expect(mockStockAlertService.createStockAlerts).not.toHaveBeenCalled()
    })
  })

  describe("Customer Authorization & Cancellation", () => {
    it("should allow customer to cancel their own active stock alert", async () => {
      const mockStockAlertService = {
        retrieveStockAlert: jest.fn().mockResolvedValue({
          id: "sta_1",
          customer_id: "cus_1",
          status: "active",
        }),
        updateStockAlerts: jest.fn().mockResolvedValue({
          id: "sta_1",
          customer_id: "cus_1",
          status: "cancelled",
        }),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await cancelStockAlertWorkflow(container).run({
        input: {
          id: "sta_1",
          customer_id: "cus_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.status).toBe("cancelled")
      expect(mockStockAlertService.updateStockAlerts).toHaveBeenCalledWith({
        id: "sta_1",
        status: "cancelled",
      })
    })

    it("should throw NOT_ALLOWED if customer tries to cancel another customer's alert", async () => {
      const mockStockAlertService = {
        retrieveStockAlert: jest.fn().mockResolvedValue({
          id: "sta_1",
          customer_id: "cus_owner",
          status: "active",
        }),
        updateStockAlerts: jest.fn(),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
      })

      const { errors } = await cancelStockAlertWorkflow(container)
        .run({
          input: {
            id: "sta_1",
            customer_id: "cus_attacker",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Stock alert does not belong to customer cus_attacker"
      )
      expect(mockStockAlertService.updateStockAlerts).not.toHaveBeenCalled()
    })
  })

  describe("Back-in-Stock Processing & Notification Generation", () => {
    it("should process active stock alerts when variant stock becomes available", async () => {
      const mockProductService = {
        retrieveProductVariant: jest.fn().mockResolvedValue({
          id: "var_1",
          manage_inventory: true,
        }),
      }
      const mockInventoryService = {
        listInventoryLevels: jest.fn().mockResolvedValue([
          { stocked_quantity: 10, reserved_quantity: 2 },
        ]),
      }
      const activeAlert = {
        id: "sta_1",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        channel: "sms",
        status: "active",
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[activeAlert], 1]),
        retrieveStockAlert: jest.fn().mockResolvedValue(activeAlert),
        updateStockAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ ...activeAlert, ...data })
        ),
      }
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({
          id: "cus_1",
          phone: "09123456789",
          email: "customer@example.com",
        }),
      }
      const mockNotificationService = {
        createNotifications: jest.fn().mockResolvedValue([{ id: "notif_1" }]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.INVENTORY]: asValue(mockInventoryService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
      })

      const { result } = await processStockAvailabilityWorkflow(container).run({
        input: {
          variant_id: "var_1",
          inventory_item_id: "iitem_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.notifiedCount).toBe(1)
      expect(result.alerts[0].status).toBe("notified")
      expect(mockNotificationService.createNotifications).toHaveBeenCalledWith({
        to: "09123456789",
        channel: "sms",
        template: "back-in-stock",
        trigger_type: "stock_alert.triggered",
        resource_id: "sta_1",
        resource_type: "stock_alert",
        receiver_id: "cus_1",
        data: {
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          stock_alert_id: "sta_1",
          channel: "sms",
        },
      })
    })

    it("should handle notification failure gracefully and set alert status to failed", async () => {
      const mockProductService = {
        retrieveProductVariant: jest.fn().mockResolvedValue({
          id: "var_1",
          manage_inventory: true,
        }),
      }
      const mockInventoryService = {
        listInventoryLevels: jest.fn().mockResolvedValue([
          { stocked_quantity: 5, reserved_quantity: 0 },
        ]),
      }
      const activeAlert = {
        id: "sta_1",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        channel: "sms",
        status: "active",
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[activeAlert], 1]),
        retrieveStockAlert: jest.fn().mockResolvedValue(activeAlert),
        updateStockAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ ...activeAlert, ...data })
        ),
      }
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockNotificationService = {
        createNotifications: jest
          .fn()
          .mockRejectedValue(new Error("Notification provider error")),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.INVENTORY]: asValue(mockInventoryService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
      })

      const { result } = await processStockAvailabilityWorkflow(container).run({
        input: {
          variant_id: "var_1",
          inventory_item_id: "iitem_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.notifiedCount).toBe(1)
      expect(result.alerts[0].status).toBe("failed")
      expect(mockStockAlertService.updateStockAlerts).toHaveBeenCalledWith({
        id: "sta_1",
        status: "failed",
      })
    })
  })

  describe("Store API Routes", () => {
    it("should reject unauthenticated request with 401", async () => {
      const req: any = { auth_context: null }
      const res: any = {}

      await expect(createStockAlert(req, res)).rejects.toThrow(
        "Authentication required to create stock alert"
      )
    })

    it("should return stock alerts filtered for authenticated customer only", async () => {
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([
          [
            {
              id: "sta_1",
              customer_id: "cus_1",
              product_id: "prod_1",
              variant_id: "var_1",
              channel: "sms",
              status: "active",
            },
          ],
          1,
        ]),
      }

      const req: any = {
        auth_context: { actor_id: "cus_1" },
        validatedQuery: { limit: 20, offset: 0 },
        scope: {
          resolve: jest.fn().mockReturnValue(mockStockAlertService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getStockAlerts(req, res)

      expect(mockStockAlertService.listAndCountStockAlerts).toHaveBeenCalledWith(
        { customer_id: "cus_1" },
        expect.objectContaining({ skip: 0, take: 20 })
      )
      expect(jsonMock).toHaveBeenCalledWith({
        stock_alerts: expect.arrayContaining([
          expect.objectContaining({ id: "sta_1", customer_id: "cus_1" }),
        ]),
        count: 1,
        limit: 20,
        offset: 0,
      })
    })

    it("should create stock alert via POST /store/products/:id/stock-alerts", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([[], 0]),
        createStockAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ id: "sta_1", ...data, status: "active" })
        ),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const reqContainer = createMedusaContainer()
      reqContainer.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const req: any = {
        params: { id: "prod_1" },
        auth_context: { actor_id: "cus_1" },
        validatedBody: { variant_id: "var_1", channel: "sms" },
        scope: reqContainer,
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock, json: jsonMock }

      await createProductStockAlert(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        stock_alert: expect.objectContaining({
          id: "sta_1",
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
        }),
      })
    })

    it("should cancel stock alert via DELETE /store/stock-alerts/:id", async () => {
      const mockStockAlertService = {
        retrieveStockAlert: jest.fn().mockResolvedValue({
          id: "sta_1",
          customer_id: "cus_1",
          status: "active",
        }),
        updateStockAlerts: jest.fn().mockResolvedValue({
          id: "sta_1",
          customer_id: "cus_1",
          status: "cancelled",
        }),
      }
      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const reqContainer = createMedusaContainer()
      reqContainer.register({
        [Modules.STOCK_ALERT]: asValue(mockStockAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const req: any = {
        params: { id: "sta_1" },
        auth_context: { actor_id: "cus_1" },
        scope: reqContainer,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await cancelStockAlert(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        id: "sta_1",
        object: "stock_alert",
        deleted: true,
        stock_alert: expect.objectContaining({ status: "cancelled" }),
      })
    })
  })

  describe("Admin API Routes", () => {
    it("should list all stock alerts with filters for admin", async () => {
      const mockStockAlertService = {
        listAndCountStockAlerts: jest.fn().mockResolvedValue([
          [
            {
              id: "sta_1",
              customer_id: "cus_1",
              product_id: "prod_1",
              variant_id: "var_1",
              status: "active",
            },
          ],
          1,
        ]),
      }

      const req: any = {
        validatedQuery: {
          limit: 10,
          offset: 0,
          product_id: "prod_1",
          status: "active",
        },
        scope: {
          resolve: jest.fn().mockReturnValue(mockStockAlertService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await adminGetStockAlerts(req, res)

      expect(mockStockAlertService.listAndCountStockAlerts).toHaveBeenCalledWith(
        { product_id: "prod_1", status: "active" },
        expect.objectContaining({ skip: 0, take: 10 })
      )
      expect(jsonMock).toHaveBeenCalledWith({
        stock_alerts: expect.arrayContaining([
          expect.objectContaining({ id: "sta_1", product_id: "prod_1" }),
        ]),
        count: 1,
        limit: 10,
        offset: 0,
      })
    })

    it("should retrieve a single stock alert for admin", async () => {
      const mockStockAlertService = {
        retrieveStockAlert: jest.fn().mockResolvedValue({
          id: "sta_1",
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          status: "active",
        }),
      }

      const req: any = {
        params: { id: "sta_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockStockAlertService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await adminGetStockAlert(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        stock_alert: expect.objectContaining({ id: "sta_1" }),
      })
    })
  })
})
