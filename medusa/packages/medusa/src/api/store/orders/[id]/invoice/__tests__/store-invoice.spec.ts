import { GET as getOrderInvoice } from "../route"
import { GET as getOrderInvoicePdf } from "../pdf/route"
import { Modules } from "@medusajs/framework/utils"

describe("Store Order Invoice API", () => {
  it("should return invoice JSON for order", async () => {
    const mockOrder = { id: "order_1", customer_id: "cus_1" }
    const mockInvoice = { id: "inv_1", order_id: "order_1", invoice_number: "INV-001" }

    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue(mockOrder),
    }

    const mockInvoiceService = {
      listAndCountInvoices: jest.fn().mockResolvedValue([[mockInvoice], 1]),
    }

    const req: any = {
      params: { id: "order_1" },
      auth_context: { actor_id: "cus_1" },
      scope: {
        resolve: jest.fn((name) => {
          if (name === Modules.ORDER) return mockOrderService
          if (name === Modules.INVOICE) return mockInvoiceService
          return null
        }),
      },
    }

    const jsonMock = jest.fn()
    const res: any = {
      status: jest.fn().mockReturnValue({ json: jsonMock }),
    }

    await getOrderInvoice(req, res)

    expect(jsonMock).toHaveBeenCalledWith({ invoice: mockInvoice })
  })

  it("should throw 404 if customer attempts to access another customer's order invoice", async () => {
    const mockOrder = { id: "order_1", customer_id: "cus_1" }

    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue(mockOrder),
    }

    const req: any = {
      params: { id: "order_1" },
      auth_context: { actor_id: "cus_OTHER" },
      scope: {
        resolve: jest.fn((name) => {
          if (name === Modules.ORDER) return mockOrderService
          return null
        }),
      },
    }

    const res: any = {}

    await expect(getOrderInvoice(req, res)).rejects.toThrow("Invoice not found for order order_1")
  })

  it("should throw 404 if unauthenticated guest attempts to access a customer's order invoice", async () => {
    const mockOrder = { id: "order_1", customer_id: "cus_1" }

    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue(mockOrder),
    }

    const req: any = {
      params: { id: "order_1" },
      auth_context: null, // unauthenticated
      scope: {
        resolve: jest.fn((name) => {
          if (name === Modules.ORDER) return mockOrderService
          return null
        }),
      },
    }

    const res: any = {}

    await expect(getOrderInvoice(req, res)).rejects.toThrow("Invoice not found for order order_1")
    await expect(getOrderInvoicePdf(req, res)).rejects.toThrow("Invoice not found for order order_1")
  })

  it("should return PDF buffer with correct headers", async () => {
    const mockOrder = { id: "order_1", customer_id: "cus_1" }
    const mockInvoice = { id: "inv_1", order_id: "order_1", invoice_number: "INV-001" }
    const pdfBuffer = Buffer.from("%PDF-1.4 mock pdf content")

    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue(mockOrder),
    }

    const mockInvoiceService = {
      listAndCountInvoices: jest.fn().mockResolvedValue([[mockInvoice], 1]),
      generatePdf: jest.fn().mockResolvedValue(pdfBuffer),
    }

    const req: any = {
      params: { id: "order_1" },
      auth_context: { actor_id: "cus_1" },
      scope: {
        resolve: jest.fn((name) => {
          if (name === Modules.ORDER) return mockOrderService
          if (name === Modules.INVOICE) return mockInvoiceService
          return null
        }),
      },
    }

    const headers: Record<string, string> = {}
    const sendMock = jest.fn()
    const res: any = {
      setHeader: jest.fn((key, val) => {
        headers[key] = val
      }),
      status: jest.fn().mockReturnValue({ send: sendMock }),
    }

    await getOrderInvoicePdf(req, res)

    expect(headers["Content-Type"]).toBe("application/pdf")
    expect(headers["Content-Disposition"]).toContain("invoice-INV-001.pdf")
    expect(sendMock).toHaveBeenCalledWith(pdfBuffer)
  })
})
