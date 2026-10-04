import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { id: orderId } = req.params
  const invoiceService = req.scope.resolve<any>(Modules.INVOICE)

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

  res.status(200).json({ invoice })
}
