import { Module, Modules } from "@medusajs/framework/utils"
import MediaModuleService from "./services/media-module-service"

export default Module(Modules.MEDIA, {
  service: MediaModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
export * from "./utils/media-upload-helper"
