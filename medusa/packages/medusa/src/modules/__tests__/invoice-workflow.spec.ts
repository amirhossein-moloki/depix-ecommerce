import { createInvoiceWorkflow } from "@medusajs/core-flows"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("createInvoiceWorkflow", () => {
  it("should create invoice and generate snapshot from order", async () => {
    const mockOrder = {
      id: "ord_test_123",
      display_id: 1001,
      customer_id: "cus_123",
      currency_code: "usd",
      subtotal: 200,
      tax_total: 20,
      discount_total: 10,
      shipping_total: 15,
      total: 225,
      billing_address: {
        first_name: "Alice",
        last_name: "Smith",
        address_1: "100 Main St",
        city: "Metropolis",
        country_code: "us",
      },
      shipping_address: {
        first_name: "Alice",
        last_name: "Smith",
        address_1: "100 Main St",
        city: "Metropolis",
        country_code: "us",
      },
      items: [
        {
          id: "item_1",
          title: "Widget A",
          quantity: 2,
          unit_price: 100,
          subtotal: 200,
          total: 200,
        },
      ],
    }

    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue(mockOrder),
    }

    let createdInvoiceData: any = null
    const mockInvoiceService = {
      listAndCountInvoices: jest.fn().mockResolvedValue([[], 0]),
      getNextInvoiceNumber: jest.fn().mockResolvedValue("INV-20251004-00001"),
      createInvoices: jest.fn().mockImplementation((data) => {
        createdInvoiceData = { id: "inv_created_1", ...data }
        return Promise.resolve(createdInvoiceData)
      }),
      generatePdf: jest.fn().mockResolvedValue(Buffer.from("%PDF-mock")),
      updateInvoices: jest.fn().mockResolvedValue(undefined),
    }

    const mockFileService = {
      createFiles: jest.fn().mockResolvedValue([
        { id: "file_1", url: "http://storage.local/invoices/inv1.pdf" },
      ]),
    }

    const mockEventBus = {
      emit: jest.fn().mockResolvedValue(undefined),
      releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      clearGroupedEvents: jest.fn().mockResolvedValue(undefined),
    }

    const container = createMedusaContainer()
    container.register({
      [Modules.ORDER]: asValue(mockOrderService),
      [Modules.INVOICE]: asValue(mockInvoiceService),
      [Modules.FILE]: asValue(mockFileService),
      [Modules.EVENT_BUS]: asValue(mockEventBus),
    })

    const { result } = await createInvoiceWorkflow(container).run({
      input: {
        order_id: "ord_test_123",
      },
      container,
      throwOnError: true,
    })

    expect(result.id).toBe("inv_created_1")
    expect(result.invoice_number).toBe("INV-20251004-00001")
    expect(result.order_id).toBe("ord_test_123")
    expect(result.subtotal).toBe(200)
    expect(result.total).toBe(225)
    expect(result.file_url).toBe("http://storage.local/invoices/inv1.pdf")
    expect(mockInvoiceService.createInvoices).toHaveBeenCalled()
  })

  it("should return existing invoice if already created (idempotency)", async () => {
    const existingInvoice = {
      id: "inv_existing_1",
      invoice_number: "INV-20251004-00001",
      order_id: "ord_test_123",
      total: 225,
    }

    const mockInvoiceService = {
      listAndCountInvoices: jest.fn().mockResolvedValue([[existingInvoice], 1]),
      createInvoices: jest.fn(),
    }

    const mockEventBus = {
      emit: jest.fn().mockResolvedValue(undefined),
      releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      clearGroupedEvents: jest.fn().mockResolvedValue(undefined),
    }

    const container = createMedusaContainer()
    container.register({
      [Modules.INVOICE]: asValue(mockInvoiceService),
      [Modules.EVENT_BUS]: asValue(mockEventBus),
    })

    const { result } = await createInvoiceWorkflow(container).run({
      input: {
        order_id: "ord_test_123",
      },
      container,
      throwOnError: true,
    })

    expect(result.id).toBe("inv_existing_1")
    expect(mockInvoiceService.createInvoices).not.toHaveBeenCalled()
  })
})
