import { Module } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"
import PriceAlertModuleService from "./services/price-alert-module-service"

export default Module(Modules.PRICE_ALERT, {
  service: PriceAlertModuleService,
})
