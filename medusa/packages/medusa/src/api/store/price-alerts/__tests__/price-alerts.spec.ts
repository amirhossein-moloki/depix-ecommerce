import { POST as createProductPriceAlert } from "../../products/[id]/price-alerts/route"
import { POST as createPriceAlert, GET as getPriceAlerts } from "../route"
import { GET as getPriceAlert, DELETE as cancelPriceAlert } from "../[id]/route"
import { GET as adminGetPriceAlerts } from "../../../admin/price-alerts/route"
import { GET as adminGetPriceAlert } from "../../../admin/price-alerts/[id]/route"
import { createPriceAlertWorkflow } from "@medusajs/core-flows"
import { cancelPriceAlertWorkflow } from "@medusajs/core-flows"
import { processPriceChangeWorkflow } from "@medusajs/core-flows"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Price Change Alert API, Workflows & Price Change Integration", () => {
  const mockEventBus = {
    emit: jest.fn().mockResolvedValue(undefined),
    releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
    clearGroupedEvents: jest.fn().mockResolvedValue(undefined),
  }

  describe("Price Alert Workflows & Validations", () => {
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
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
      })

      const { errors } = await createPriceAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_nonexistent",
            product_id: "prod_1",
            variant_id: "var_1",
            currency_code: "usd",
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
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
      })

      const { errors } = await createPriceAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_nonexistent",
            variant_id: "var_1",
            currency_code: "usd",
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
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
      })

      const { errors } = await createPriceAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_1",
            variant_id: "var_1",
            currency_code: "usd",
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
        [Modules.PRICE_ALERT]: asValue({}),
      })

      const { errors } = await createPriceAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_1",
            variant_id: "var_1",
            currency_code: "usd",
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

    it("should throw error if invalid alert_type is requested", async () => {
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
        [Modules.PRICE_ALERT]: asValue({}),
      })

      const { errors } = await createPriceAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_1",
            variant_id: "var_1",
            currency_code: "usd",
            alert_type: "invalid_type",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Invalid alert_type")
    })

    it("should throw error if target_price is missing or non-positive for target_price alert type", async () => {
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
        [Modules.PRICE_ALERT]: asValue({}),
      })

      const { errors } = await createPriceAlertWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_1",
            variant_id: "var_1",
            currency_code: "usd",
            alert_type: "target_price",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("target_price must be a positive number")
    })

    it("should create price alert successfully", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[], 0]),
        createPriceAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ id: "pal_1", ...data, status: "active" })
        ),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createPriceAlertWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          currency_code: "usd",
          alert_type: "price_drop",
          reference_price: 100,
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("pal_1")
      expect(result.customer_id).toBe("cus_1")
      expect(result.currency_code).toBe("usd")
      expect(result.alert_type).toBe("price_drop")
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
        id: "pal_existing",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        currency_code: "usd",
        alert_type: "price_drop",
        status: "active",
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest
          .fn()
          .mockResolvedValue([[existingAlert], 1]),
        createPriceAlerts: jest.fn(),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createPriceAlertWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          currency_code: "usd",
          alert_type: "price_drop",
          reference_price: 100,
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("pal_existing")
      expect(mockPriceAlertService.createPriceAlerts).not.toHaveBeenCalled()
    })
  })

  describe("Customer Authorization & Cancellation", () => {
    it("should allow customer to cancel their own active price alert", async () => {
      const mockPriceAlertService = {
        retrievePriceAlert: jest.fn().mockResolvedValue({
          id: "pal_1",
          customer_id: "cus_1",
          status: "active",
        }),
        updatePriceAlerts: jest.fn().mockResolvedValue({
          id: "pal_1",
          customer_id: "cus_1",
          status: "cancelled",
        }),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await cancelPriceAlertWorkflow(container).run({
        input: {
          id: "pal_1",
          customer_id: "cus_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.status).toBe("cancelled")
      expect(mockPriceAlertService.updatePriceAlerts).toHaveBeenCalledWith({
        id: "pal_1",
        status: "cancelled",
      })
    })

    it("should throw NOT_ALLOWED if customer tries to cancel another customer's alert", async () => {
      const mockPriceAlertService = {
        retrievePriceAlert: jest.fn().mockResolvedValue({
          id: "pal_1",
          customer_id: "cus_owner",
          status: "active",
        }),
        updatePriceAlerts: jest.fn(),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
      })

      const { errors } = await cancelPriceAlertWorkflow(container)
        .run({
          input: {
            id: "pal_1",
            customer_id: "cus_attacker",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain(
        "Customer cus_attacker is not allowed to cancel price alert"
      )
      expect(mockPriceAlertService.updatePriceAlerts).not.toHaveBeenCalled()
    })
  })

  describe("Price Change Detection, Triggers & Notification Generation", () => {
    it("should process price drop alert when new_price < old_price", async () => {
      const activeAlert = {
        id: "pal_1",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        currency_code: "usd",
        alert_type: "price_drop",
        channel: "in-app",
        status: "active",
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[activeAlert], 1]),
        retrievePriceAlert: jest.fn().mockResolvedValue(activeAlert),
        updatePriceAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ ...activeAlert, ...data })
        ),
      }
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({
          id: "cus_1",
          email: "customer@example.com",
        }),
      }
      const mockNotificationService = {
        createNotifications: jest.fn().mockResolvedValue([{ id: "notif_1" }]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await processPriceChangeWorkflow(container).run({
        input: {
          variant_id: "var_1",
          currency_code: "usd",
          old_price: 100,
          new_price: 80,
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.notifiedCount).toBe(1)
      expect(result.alerts[0].status).toBe("notified")
      expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "customer@example.com",
          trigger_type: "price_alert.triggered",
          resource_id: "pal_1",
          resource_type: "price_alert",
          receiver_id: "cus_1",
          idempotency_key: "price_alert_pal_1",
          data: expect.objectContaining({
            old_price: "100",
            new_price: "80",
            currency_code: "usd",
          }),
        })
      )
    })

    it("should NOT trigger price drop alert if price increases", async () => {
      const activeAlert = {
        id: "pal_1",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        currency_code: "usd",
        alert_type: "price_drop",
        channel: "in-app",
        status: "active",
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[activeAlert], 1]),
        retrievePriceAlert: jest.fn().mockResolvedValue(activeAlert),
        updatePriceAlerts: jest.fn(),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await processPriceChangeWorkflow(container).run({
        input: {
          variant_id: "var_1",
          currency_code: "usd",
          old_price: 100,
          new_price: 120,
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.notifiedCount).toBe(0)
      expect(mockPriceAlertService.updatePriceAlerts).not.toHaveBeenCalled()
    })

    it("should process any_change alert on both price increase and decrease", async () => {
      const activeAlert = {
        id: "pal_1",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        currency_code: "usd",
        alert_type: "any_change",
        channel: "in-app",
        status: "active",
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[activeAlert], 1]),
        retrievePriceAlert: jest.fn().mockResolvedValue(activeAlert),
        updatePriceAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ ...activeAlert, ...data })
        ),
      }
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1", email: "cus@test.com" }),
      }
      const mockNotificationService = {
        createNotifications: jest.fn().mockResolvedValue([{ id: "notif_1" }]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await processPriceChangeWorkflow(container).run({
        input: {
          variant_id: "var_1",
          currency_code: "usd",
          old_price: 100,
          new_price: 110,
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.notifiedCount).toBe(1)
      expect(result.alerts[0].status).toBe("notified")
    })

    it("should process target_price alert only when new_price <= target_price", async () => {
      const activeAlert = {
        id: "pal_1",
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "var_1",
        currency_code: "usd",
        alert_type: "target_price",
        target_price: 75,
        channel: "in-app",
        status: "active",
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[activeAlert], 1]),
        retrievePriceAlert: jest.fn().mockResolvedValue(activeAlert),
        updatePriceAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ ...activeAlert, ...data })
        ),
      }
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1", email: "cus@test.com" }),
      }
      const mockNotificationService = {
        createNotifications: jest.fn().mockResolvedValue([{ id: "notif_1" }]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.NOTIFICATION]: asValue(mockNotificationService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      // Price drops to 80 (not meeting target of 75)
      const { result: res1 } = await processPriceChangeWorkflow(container).run({
        input: {
          variant_id: "var_1",
          currency_code: "usd",
          old_price: 100,
          new_price: 80,
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })
      expect(res1.notifiedCount).toBe(0)

      // Price drops to 70 (meets target of 75)
      const { result: res2 } = await processPriceChangeWorkflow(container).run({
        input: {
          variant_id: "var_1",
          currency_code: "usd",
          old_price: 80,
          new_price: 70,
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })
      expect(res2.notifiedCount).toBe(1)
      expect(res2.alerts[0].status).toBe("notified")
    })
  })

  describe("Store API Routes", () => {
    it("should reject unauthenticated request with 401", async () => {
      const req: any = { auth_context: null }
      const res: any = {}

      await expect(getPriceAlerts(req, res)).rejects.toThrow(
        "Authentication required to access price alerts"
      )
    })

    it("should return price alerts filtered for authenticated customer only", async () => {
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([
          [
            {
              id: "pal_1",
              customer_id: "cus_1",
              product_id: "prod_1",
              variant_id: "var_1",
              currency_code: "usd",
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
          resolve: jest.fn().mockReturnValue(mockPriceAlertService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getPriceAlerts(req, res)

      expect(mockPriceAlertService.listAndCountPriceAlerts).toHaveBeenCalledWith(
        { customer_id: "cus_1" },
        expect.objectContaining({ skip: 0, take: 20 })
      )
      expect(jsonMock).toHaveBeenCalledWith({
        price_alerts: expect.arrayContaining([
          expect.objectContaining({ id: "pal_1", customer_id: "cus_1" }),
        ]),
        count: 1,
        limit: 20,
        offset: 0,
      })
    })

    it("should create price alert via POST /store/products/:id/price-alerts", async () => {
      const mockCustomerService = {
        retrieveCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      }
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1" }),
        retrieveProductVariant: jest
          .fn()
          .mockResolvedValue({ id: "var_1", product_id: "prod_1" }),
      }
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([[], 0]),
        createPriceAlerts: jest.fn().mockImplementation((data) =>
          Promise.resolve({ id: "pal_1", ...data, status: "active" })
        ),
      }

      const reqContainer = createMedusaContainer()
      reqContainer.register({
        [Modules.CUSTOMER]: asValue(mockCustomerService),
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const req: any = {
        params: { id: "prod_1" },
        auth_context: { actor_id: "cus_1" },
        validatedBody: {
          variant_id: "var_1",
          currency_code: "usd",
          alert_type: "price_drop",
        },
        scope: reqContainer,
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock, json: jsonMock }

      await createProductPriceAlert(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        price_alert: expect.objectContaining({
          id: "pal_1",
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          currency_code: "usd",
        }),
      })
    })

    it("should cancel price alert via DELETE /store/price-alerts/:id", async () => {
      const mockPriceAlertService = {
        retrievePriceAlert: jest.fn().mockResolvedValue({
          id: "pal_1",
          customer_id: "cus_1",
          status: "active",
        }),
        updatePriceAlerts: jest.fn().mockResolvedValue({
          id: "pal_1",
          customer_id: "cus_1",
          status: "cancelled",
        }),
      }

      const reqContainer = createMedusaContainer()
      reqContainer.register({
        [Modules.PRICE_ALERT]: asValue(mockPriceAlertService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const req: any = {
        params: { id: "pal_1" },
        auth_context: { actor_id: "cus_1" },
        scope: reqContainer,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await cancelPriceAlert(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        object: "price_alert",
        price_alert: expect.objectContaining({ status: "cancelled" }),
      })
    })
  })

  describe("Admin API Routes", () => {
    it("should list all price alerts with filters for admin", async () => {
      const mockPriceAlertService = {
        listAndCountPriceAlerts: jest.fn().mockResolvedValue([
          [
            {
              id: "pal_1",
              customer_id: "cus_1",
              product_id: "prod_1",
              variant_id: "var_1",
              currency_code: "usd",
              status: "active",
            },
          ],
          1,
        ]),
      }

      const req: any = {
        filterableFields: {
          limit: 10,
          offset: 0,
          product_id: "prod_1",
          status: "active",
        },
        scope: {
          resolve: jest.fn().mockReturnValue(mockPriceAlertService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await adminGetPriceAlerts(req, res)

      expect(mockPriceAlertService.listAndCountPriceAlerts).toHaveBeenCalledWith(
        { product_id: "prod_1", status: "active" },
        expect.objectContaining({ skip: 0, take: 10 })
      )
      expect(jsonMock).toHaveBeenCalledWith({
        price_alerts: expect.arrayContaining([
          expect.objectContaining({ id: "pal_1", product_id: "prod_1" }),
        ]),
        count: 1,
        limit: 10,
        offset: 0,
      })
    })

    it("should retrieve a single price alert for admin", async () => {
      const mockPriceAlertService = {
        retrievePriceAlert: jest.fn().mockResolvedValue({
          id: "pal_1",
          customer_id: "cus_1",
          product_id: "prod_1",
          variant_id: "var_1",
          status: "active",
        }),
      }

      const req: any = {
        params: { id: "pal_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockPriceAlertService),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await adminGetPriceAlert(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        price_alert: expect.objectContaining({ id: "pal_1" }),
      })
    })
  })
})
