import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { id } = req.params
  const invoiceService = req.scope.resolve<any>(Modules.INVOICE)

  try {
    const invoice = await invoiceService.retrieveInvoice(id, {
      relations: ["items"],
    })
    res.json({ invoice })
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Invoice with id ${id} not found`
    )
  }
}
