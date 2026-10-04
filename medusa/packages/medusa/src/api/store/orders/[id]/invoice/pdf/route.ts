import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const orderId = req.params.id
  const orderService = req.scope.resolve<any>(Modules.ORDER)
  const invoiceService = req.scope.resolve<any>(Modules.INVOICE)

  let order: any = null
  try {
    order = await orderService.retrieveOrder(orderId)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id ${orderId} not found`
    )
  }

  const customerId = req.auth_context?.actor_id
  if (order.customer_id && order.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Invoice not found for order ${orderId}`
    )
  }

  const [invoices] = await invoiceService.listAndCountInvoices(
    { order_id: orderId },
    { relations: ["items"] }
  )

  const invoice = invoices?.[0]
  if (!invoice) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Invoice not found for order ${orderId}`
    )
  }

  const pdfBuffer = await invoiceService.generatePdf(invoice.id)

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${invoice.invoice_number || invoice.id}.pdf"`
  )
  res.status(200).send(pdfBuffer)
}
