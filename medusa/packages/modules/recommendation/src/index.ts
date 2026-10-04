import { Module, Modules } from "@medusajs/framework/utils"
import RecommendationModuleService from "./services/recommendation-module-service"

export default Module(Modules.RECOMMENDATION, {
  service: RecommendationModuleService,
})

export * from "./models"
export * from "./types"
export { default as RecommendationModuleService } from "./services/recommendation-module-service"
export * from "./services/training-pipeline"
export * from "./providers/recommendation-provider"
export * from "./providers/rule-based-provider"
export * from "./providers/ml-provider"
export * from "./providers/hybrid-provider"
export * from "./events/recommendation-events"
