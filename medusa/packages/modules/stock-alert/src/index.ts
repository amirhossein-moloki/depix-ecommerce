import { Module, Modules } from "@medusajs/framework/utils"
import StockAlertModuleService from "./services/stock-alert-module-service"

export default Module(Modules.STOCK_ALERT, {
  service: StockAlertModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
