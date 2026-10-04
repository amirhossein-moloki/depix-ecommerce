import { Module, Modules } from "@medusajs/framework/utils"
import InvoiceModuleService from "./services/invoice-module-service"

export default Module(Modules.INVOICE, {
  service: InvoiceModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
export * from "./utils/generate-pdf"
