import { Module, Modules } from "@medusajs/framework/utils"
import RecommendationModuleService from "./services/recommendation-module-service"

export default Module(Modules.RECOMMENDATION, {
  service: RecommendationModuleService,
})

export * from "./models"
export * from "./types"
export * from "./services"
export * from "./providers/recommendation-provider"
export * from "./providers/rule-based-provider"
export * from "./events/recommendation-events"
