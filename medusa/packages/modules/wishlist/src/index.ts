import { Module, Modules } from "@medusajs/framework/utils"
import WishlistModuleService from "./services/wishlist-module-service"

export default Module(Modules.WISHLIST, {
  service: WishlistModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
