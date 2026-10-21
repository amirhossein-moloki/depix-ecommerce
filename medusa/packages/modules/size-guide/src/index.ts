import { Module, Modules } from "@medusajs/framework/utils"
import SizeGuideModuleService from "./services/size-guide-module-service"

export default Module(Modules.SIZE_GUIDE, {
  service: SizeGuideModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
