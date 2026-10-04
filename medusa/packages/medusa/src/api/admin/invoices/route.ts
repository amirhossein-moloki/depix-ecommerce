import { createInvoiceWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const invoiceService = req.scope.resolve<any>(Modules.INVOICE)

  const limit = req.queryConfig?.pagination?.take ?? 20
  const offset = req.queryConfig?.pagination?.skip ?? 0

  const filters: Record<string, any> = {}
  if (req.query?.order_id) filters.order_id = req.query.order_id
  if (req.query?.customer_id) filters.customer_id = req.query.customer_id
  if (req.query?.status) filters.status = req.query.status
  if (req.query?.invoice_number) filters.invoice_number = req.query.invoice_number

  const [invoices, count] = await invoiceService.listAndCountInvoices(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
    relations: ["items"],
  })

  res.json({
    invoices,
    count,
    offset,
    limit,
  })
}

export const POST = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { order_id } = req.body || {}

  if (!order_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "order_id is required to create an invoice"
    )
  }

  const { result: invoice } = await createInvoiceWorkflow(req.scope).run({
    input: { order_id },
  })

  res.status(200).json({ invoice })
}
