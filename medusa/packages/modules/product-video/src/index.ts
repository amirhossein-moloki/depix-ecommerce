import { Module, Modules } from "@medusajs/framework/utils"
import ProductVideoModuleService from "./services/product-video-module-service"

export default Module(Modules.PRODUCT_VIDEO, {
  service: ProductVideoModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
export * from "./utils/video-helpers"
