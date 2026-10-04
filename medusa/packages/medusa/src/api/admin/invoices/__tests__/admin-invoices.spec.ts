import { GET as listInvoices, POST as createInvoice } from "../route"
import { GET as getInvoice } from "../[id]/route"
import { GET as getInvoicePdf } from "../[id]/pdf/route"
import { GET as getOrderInvoice } from "../../orders/[id]/invoice/route"
import { Modules } from "@medusajs/framework/utils"

describe("Admin Invoice API Routes", () => {
  it("should list invoices with pagination and filtering", async () => {
    const mockInvoices = [
      { id: "inv_1", invoice_number: "INV-001", order_id: "ord_1" },
      { id: "inv_2", invoice_number: "INV-002", order_id: "ord_2" },
    ]

    const mockInvoiceService = {
      listAndCountInvoices: jest.fn().mockResolvedValue([mockInvoices, 2]),
    }

    const req: any = {
      query: { order_id: "ord_1" },
      queryConfig: { pagination: { take: 10, skip: 0 } },
      scope: {
        resolve: jest.fn().mockReturnValue(mockInvoiceService),
      },
    }

    const jsonMock = jest.fn()
    const res: any = { json: jsonMock }

    await listInvoices(req, res)

    expect(jsonMock).toHaveBeenCalledWith({
      invoices: mockInvoices,
      count: 2,
      offset: 0,
      limit: 10,
    })
    expect(mockInvoiceService.listAndCountInvoices).toHaveBeenCalledWith(
      { order_id: "ord_1" },
      expect.objectContaining({ take: 10, skip: 0 })
    )
  })

  it("should retrieve single invoice by ID", async () => {
    const mockInvoice = { id: "inv_1", invoice_number: "INV-001" }

    const mockInvoiceService = {
      retrieveInvoice: jest.fn().mockResolvedValue(mockInvoice),
    }

    const req: any = {
      params: { id: "inv_1" },
      scope: { resolve: jest.fn().mockReturnValue(mockInvoiceService) },
    }

    const jsonMock = jest.fn()
    const res: any = { json: jsonMock }

    await getInvoice(req, res)

    expect(jsonMock).toHaveBeenCalledWith({ invoice: mockInvoice })
  })

  it("should generate/download invoice PDF via GET /admin/invoices/:id/pdf", async () => {
    const mockInvoice = { id: "inv_1", invoice_number: "INV-001" }
    const pdfBuffer = Buffer.from("%PDF-admin mock pdf")

    const mockInvoiceService = {
      retrieveInvoice: jest.fn().mockResolvedValue(mockInvoice),
      generatePdf: jest.fn().mockResolvedValue(pdfBuffer),
    }

    const req: any = {
      params: { id: "inv_1" },
      scope: { resolve: jest.fn().mockReturnValue(mockInvoiceService) },
    }

    const headers: Record<string, string> = {}
    const sendMock = jest.fn()
    const res: any = {
      setHeader: jest.fn((k, v) => {
        headers[k] = v
      }),
      status: jest.fn().mockReturnValue({ send: sendMock }),
    }

    await getInvoicePdf(req, res)

    expect(headers["Content-Type"]).toBe("application/pdf")
    expect(headers["Content-Disposition"]).toContain("invoice-INV-001.pdf")
    expect(sendMock).toHaveBeenCalledWith(pdfBuffer)
  })

  it("should retrieve invoice by order ID via GET /admin/orders/:id/invoice", async () => {
    const mockInvoice = { id: "inv_1", order_id: "ord_100", invoice_number: "INV-100" }

    const mockInvoiceService = {
      listAndCountInvoices: jest.fn().mockResolvedValue([[mockInvoice], 1]),
    }

    const req: any = {
      params: { id: "ord_100" },
      scope: { resolve: jest.fn().mockReturnValue(mockInvoiceService) },
    }

    const jsonMock = jest.fn()
    const res: any = { status: jest.fn().mockReturnValue({ json: jsonMock }) }

    await getOrderInvoice(req, res)

    expect(jsonMock).toHaveBeenCalledWith({ invoice: mockInvoice })
  })

  it("should throw 400 on POST /admin/invoices if order_id is missing", async () => {
    const req: any = { body: {} }
    const res: any = {}

    await expect(createInvoice(req, res)).rejects.toThrow("order_id is required")
  })
})
