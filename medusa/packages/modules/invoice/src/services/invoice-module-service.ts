import { MedusaService } from "@medusajs/framework/utils"
import { Invoice, InvoiceItem, InvoiceSequence } from "../models"
import { generateInvoicePdf } from "../utils/generate-pdf"

export default class InvoiceModuleService extends MedusaService({
  Invoice,
  InvoiceItem,
  InvoiceSequence,
}) {
  /**
   * Generates a safe, sequential invoice number.
   * Format: INV-YYYYMMDD-XXXXX
   */
  async getNextInvoiceNumber(
    prefix = "INV",
    sequenceName = "default"
  ): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")

    const service = this as any
    const [existingSeq] = await service.listInvoiceSequences(
      { name: sequenceName },
      { take: 1 }
    )

    let seqVal = 1
    if (existingSeq) {
      seqVal = (existingSeq.current_value || 0) + 1
      await service.updateInvoiceSequences({
        id: existingSeq.id,
        current_value: seqVal,
      })
    } else {
      await service.createInvoiceSequences({
        name: sequenceName,
        current_value: 1,
      })
    }

    const paddedSeq = seqVal.toString().padStart(5, "0")
    return `${prefix}-${dateStr}-${paddedSeq}`
  }

  /**
   * Generates PDF buffer for a given invoice.
   */
  async generatePdf(invoiceId: string): Promise<Buffer> {
    const service = this as any
    const invoice = await service.retrieveInvoice(invoiceId, {
      relations: ["items"],
    })
    return generateInvoicePdf(invoice)
  }
}
