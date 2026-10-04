import { InvoiceModuleService, generateInvoicePdf } from "../invoice"

describe("InvoiceModuleService & PDF Generation", () => {
  it("should generate a valid PDF buffer with invoice details", async () => {
    const mockInvoice: any = {
      id: "inv_123",
      invoice_number: "INV-20251004-00001",
      order_id: "order_123",
      customer_id: "cus_123",
      status: "issued",
      currency_code: "usd",
      issue_date: new Date(),
      subtotal: 100,
      tax_total: 10,
      discount_total: 5,
      shipping_total: 15,
      total: 120,
      seller_details: {
        name: "Depix Store",
        address: "123 Main St",
        city: "Commerce",
        country: "US",
        email: "store@depix.com",
      },
      billing_address: {
        first_name: "John",
        last_name: "Doe",
        address_1: "456 Customer Rd",
        city: "Buyer City",
        country_code: "us",
      },
      items: [
        {
          id: "inv_item_1",
          title: "Test Product A",
          quantity: 2,
          unit_price: 50,
          subtotal: 100,
          total: 100,
        },
      ],
    }

    const pdfBuffer = await generateInvoicePdf(mockInvoice)

    expect(pdfBuffer).toBeInstanceOf(Buffer)
    expect(pdfBuffer.length).toBeGreaterThan(100)
    expect(pdfBuffer.toString("ascii", 0, 5)).toBe("%PDF-")
  })

  it("should generate sequential invoice numbers", async () => {
    const service = new InvoiceModuleService({} as any)

    let savedSeq: any = null

    ;(service as any).listInvoiceSequences = jest.fn().mockImplementation(() => {
      return Promise.resolve(savedSeq ? [savedSeq] : [])
    })

    ;(service as any).createInvoiceSequences = jest.fn().mockImplementation((data) => {
      savedSeq = { id: "inv_seq_1", ...data }
      return Promise.resolve(savedSeq)
    })

    ;(service as any).updateInvoiceSequences = jest.fn().mockImplementation((data) => {
      savedSeq = { ...savedSeq, ...data }
      return Promise.resolve(savedSeq)
    })

    const num1 = await service.getNextInvoiceNumber("INV", "default")
    expect(num1).toMatch(/^INV-\d{8}-00001$/)

    const num2 = await service.getNextInvoiceNumber("INV", "default")
    expect(num2).toMatch(/^INV-\d{8}-00002$/)
  })
})
