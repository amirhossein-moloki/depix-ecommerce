import { Module, Modules } from "@medusajs/framework/utils"
import BannerModuleService from "./services/banner-module-service"

export default Module(Modules.BANNER, {
  service: BannerModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
