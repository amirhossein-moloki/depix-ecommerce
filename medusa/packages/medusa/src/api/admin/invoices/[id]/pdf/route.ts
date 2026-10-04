import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { id } = req.params
  const invoiceService = req.scope.resolve<any>(Modules.INVOICE)

  let invoice: any = null
  try {
    invoice = await invoiceService.retrieveInvoice(id, {
      relations: ["items"],
    })
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Invoice with id ${id} not found`
    )
  }

  const pdfBuffer = await invoiceService.generatePdf(id)

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${invoice.invoice_number || invoice.id}.pdf"`
  )
  res.status(200).send(pdfBuffer)
}
