import { Module, Modules } from "@medusajs/framework/utils"
import ReviewModuleService from "./services/review-module-service"

export default Module(Modules.REVIEW, {
  service: ReviewModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
