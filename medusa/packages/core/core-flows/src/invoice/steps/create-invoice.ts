import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CreateInvoiceStepInput = {
  order_id: string
}

export const createInvoiceStepId = "create-invoice-step"

export const createInvoiceStep = createStep(
  createInvoiceStepId,
  async (input: CreateInvoiceStepInput, { container }) => {
    const invoiceService = container.resolve<any>(Modules.INVOICE)

    // 1. Idempotency Check: check if invoice already exists for this order
    const [existingInvoices] = await invoiceService.listAndCountInvoices(
      { order_id: input.order_id },
      { relations: ["items"] }
    )

    if (existingInvoices && existingInvoices.length > 0) {
      return new StepResponse(existingInvoices[0], { createdId: null })
    }

    // 2. Retrieve Order details
    const orderService = container.resolve<any>(Modules.ORDER)
    let order: any = null
    try {
      order = await orderService.retrieveOrder(input.order_id, {
        relations: ["items", "shipping_address", "billing_address", "summary"],
      })
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id ${input.order_id} not found`
      )
    }

    // 3. Generate sequential invoice number
    const invoiceNumber = await invoiceService.getNextInvoiceNumber("INV")

    // 4. Construct financial snapshot from order
    const rawItems = order.items || []
    const items = rawItems.map((item: any) => ({
      item_id: item.id,
      title: item.title || item.product_title || "Product",
      subtitle: item.variant_title || null,
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      subtotal: Number(item.subtotal || item.unit_price * item.quantity || 0),
      tax_total: Number(item.tax_total || 0),
      discount_total: Number(item.discount_total || 0),
      total: Number(item.total || item.subtotal || item.unit_price * item.quantity || 0),
    }))

    const subtotal = Number(
      order.subtotal ?? items.reduce((acc: number, i: any) => acc + i.subtotal, 0)
    )
    const tax_total = Number(order.tax_total || 0)
    const discount_total = Number(order.discount_total || 0)
    const shipping_total = Number(order.shipping_total || 0)
    const total = Number(
      order.total ?? subtotal + tax_total + shipping_total - discount_total
    )

    const seller_details = {
      name: "Depix Store",
      address: "123 Commerce St",
      city: "Tech City",
      country: "US",
      email: "support@depix.com",
    }

    const billing_address = order.billing_address
      ? {
          first_name: order.billing_address.first_name,
          last_name: order.billing_address.last_name,
          address_1: order.billing_address.address_1,
          address_2: order.billing_address.address_2,
          city: order.billing_address.city,
          country_code: order.billing_address.country_code,
          postal_code: order.billing_address.postal_code,
          phone: order.billing_address.phone,
        }
      : order.shipping_address
      ? {
          first_name: order.shipping_address.first_name,
          last_name: order.shipping_address.last_name,
          address_1: order.shipping_address.address_1,
          address_2: order.shipping_address.address_2,
          city: order.shipping_address.city,
          country_code: order.shipping_address.country_code,
          postal_code: order.shipping_address.postal_code,
          phone: order.shipping_address.phone,
        }
      : null

    const shipping_address = order.shipping_address
      ? {
          first_name: order.shipping_address.first_name,
          last_name: order.shipping_address.last_name,
          address_1: order.shipping_address.address_1,
          address_2: order.shipping_address.address_2,
          city: order.shipping_address.city,
          country_code: order.shipping_address.country_code,
          postal_code: order.shipping_address.postal_code,
          phone: order.shipping_address.phone,
        }
      : null

    // 5. Create Invoice record
    const invoice = await invoiceService.createInvoices({
      invoice_number: invoiceNumber,
      order_id: order.id,
      customer_id: order.customer_id || null,
      status: "issued",
      currency_code: order.currency_code || "usd",
      issue_date: new Date(),
      subtotal,
      discount_total,
      tax_total,
      shipping_total,
      total,
      seller_details,
      billing_address,
      shipping_address,
      items,
    })

    // 6. Generate PDF document and store reference
    try {
      const pdfBuffer = await invoiceService.generatePdf(invoice.id)
      let fileUrl = null
      let fileId = null

      try {
        const fileService = container.resolve<any>(Modules.FILE)
        if (fileService && typeof fileService.createFiles === "function") {
          const uploadedFile = await fileService.createFiles({
            filename: `invoices/invoice-${invoice.invoice_number}.pdf`,
            mimeType: "application/pdf",
            content: pdfBuffer.toString("base64"),
          })
          const fileResult = Array.isArray(uploadedFile)
            ? uploadedFile[0]
            : uploadedFile
          fileId = fileResult?.id || null
          fileUrl = fileResult?.url || null
        }
      } catch {
        fileUrl = `/admin/invoices/${invoice.id}/pdf`
      }

      if (fileUrl || fileId) {
        await invoiceService.updateInvoices({
          id: invoice.id,
          file_id: fileId,
          file_url: fileUrl,
        })
        invoice.file_id = fileId
        invoice.file_url = fileUrl
      }
    } catch {
      // Non-fatal if PDF upload/generation has warnings
    }

    return new StepResponse(invoice, { createdId: invoice.id })
  },
  async (compensateData, { container }) => {
    if (compensateData?.createdId) {
      const invoiceService = container.resolve<any>(Modules.INVOICE)
      await invoiceService.deleteInvoices([compensateData.createdId])
    }
  }
)
