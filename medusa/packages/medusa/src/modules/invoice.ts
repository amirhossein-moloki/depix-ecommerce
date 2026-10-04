import InvoiceModule from "@medusajs/invoice"

export * from "@medusajs/invoice"

export default InvoiceModule
let discoveryPathStr = ""
try {
  discoveryPathStr = require.resolve("@medusajs/invoice")
} catch {
  discoveryPathStr = __filename
}
export const discoveryPath = discoveryPathStr
