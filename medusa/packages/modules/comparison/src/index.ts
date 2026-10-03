import { Module, Modules } from "@medusajs/framework/utils"
import ComparisonModuleService from "./services/comparison-module-service"

export default Module(Modules.COMPARISON, {
  service: ComparisonModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
