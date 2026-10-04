import PDFDocument from "pdfkit"
import { InvoiceDTO } from "../types"

export function generateInvoicePdf(invoice: Partial<InvoiceDTO>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" })
      const buffers: Buffer[] = []

      doc.on("data", (chunk) => buffers.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(buffers)))
      doc.on("error", (err) => reject(err))

      const seller: any = invoice.seller_details || {
        name: "Depix Store",
        address: "123 Commerce St",
        city: "Tech City",
        country: "US",
        email: "support@depix.com",
      }

      doc
        .fontSize(20)
        .text("INVOICE", { align: "right" })
        .fontSize(10)
        .text(seller.name || "Depix Store", 50, 50)
        .text(seller.address || "", 50, 65)
        .text(`${seller.city || ""} ${seller.country || ""}`, 50, 80)
        .text(seller.email || "", 50, 95)

      doc.moveDown(2)

      const invoiceNum = invoice.invoice_number || invoice.id || "INV-0000"
      const issueDate = invoice.issue_date
        ? new Date(invoice.issue_date).toLocaleDateString()
        : new Date().toLocaleDateString()

      doc
        .fontSize(10)
        .text(`Invoice Number: ${invoiceNum}`)
        .text(`Order Reference: ${invoice.order_id || "N/A"}`)
        .text(`Issue Date: ${issueDate}`)
        .text(`Status: ${(invoice.status || "ISSUED").toUpperCase()}`)

      doc.moveDown(1)

      if (invoice.billing_address) {
        const addr: any = invoice.billing_address
        doc.fontSize(10).text("Billing Address:", { underline: true })
        doc.text(`${addr.first_name || ""} ${addr.last_name || ""}`.trim())
        if (addr.address_1) doc.text(addr.address_1)
        if (addr.city || addr.country_code) {
          doc.text(`${addr.city || ""}, ${addr.country_code || ""}`)
        }
        doc.moveDown(1)
      }

      doc.fontSize(12).text("Items", { underline: true }).fontSize(10)
      doc.moveDown(0.5)

      const tableTop = doc.y
      doc.text("Item", 50, tableTop)
      doc.text("Qty", 280, tableTop, { width: 50, align: "right" })
      doc.text("Unit Price", 340, tableTop, { width: 80, align: "right" })
      doc.text("Total", 430, tableTop, { width: 100, align: "right" })

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(530, tableTop + 15)
        .stroke()

      let y = tableTop + 25
      const items = invoice.items || []
      const currency = (invoice.currency_code || "USD").toUpperCase()

      items.forEach((item: any) => {
        const title = item.title || "Product Item"
        const qty = item.quantity || 1
        const unitPrice = Number(item.unit_price || 0).toFixed(2)
        const total = Number(item.total || item.subtotal || 0).toFixed(2)

        doc.text(title, 50, y, { width: 220 })
        doc.text(qty.toString(), 280, y, { width: 50, align: "right" })
        doc.text(`${unitPrice} ${currency}`, 340, y, {
          width: 80,
          align: "right",
        })
        doc.text(`${total} ${currency}`, 430, y, {
          width: 100,
          align: "right",
        })

        y += 20
      })

      doc.moveTo(50, y).lineTo(530, y).stroke()
      y += 10

      const subtotal = Number(invoice.subtotal || 0).toFixed(2)
      const taxTotal = Number(invoice.tax_total || 0).toFixed(2)
      const discountTotal = Number(invoice.discount_total || 0).toFixed(2)
      const shippingTotal = Number(invoice.shipping_total || 0).toFixed(2)
      const total = Number(invoice.total || 0).toFixed(2)

      doc.text(`Subtotal: ${subtotal} ${currency}`, 330, y, {
        width: 200,
        align: "right",
      })
      y += 15
      if (Number(invoice.discount_total || 0) > 0) {
        doc.text(`Discount: -${discountTotal} ${currency}`, 330, y, {
          width: 200,
          align: "right",
        })
        y += 15
      }
      if (Number(invoice.shipping_total || 0) > 0) {
        doc.text(`Shipping: ${shippingTotal} ${currency}`, 330, y, {
          width: 200,
          align: "right",
        })
        y += 15
      }
      if (Number(invoice.tax_total || 0) > 0) {
        doc.text(`Tax: ${taxTotal} ${currency}`, 330, y, {
          width: 200,
          align: "right",
        })
        y += 15
      }

      doc
        .fontSize(12)
        .text(`Total Amount: ${total} ${currency}`, 330, y, {
          width: 200,
          align: "right",
        })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
