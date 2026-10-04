import { MedusaService } from "@medusajs/framework/utils"
import { ProductRelationship, RecommendationModel } from "../models"

export default class RecommendationModuleService extends MedusaService({
  ProductRelationship,
  RecommendationModel,
}) {
  async getActiveModel(): Promise<any | null> {
    const [models] = await this.listAndCountRecommendationModels(
      { is_active: true, status: "ACTIVE" },
      { take: 1, order: { created_at: "DESC" } }
    )
    return models.length > 0 ? models[0] : null
  }

  async activateModel(modelId: string): Promise<any> {
    const targetModel = await this.retrieveRecommendationModel(modelId)
    if (!targetModel) {
      throw new Error(`Recommendation model with ID ${modelId} not found`)
    }

    if (targetModel.status !== "READY" && targetModel.status !== "ACTIVE") {
      throw new Error(
        `Cannot activate model ${modelId} with status '${targetModel.status}'. Model status must be READY or ACTIVE.`
      )
    }

    // Deactivate all current active models
    const [activeModels] = await this.listAndCountRecommendationModels({
      is_active: true,
    })
    for (const am of activeModels) {
      if (am.id !== modelId) {
        await this.updateRecommendationModels({
          id: am.id,
          is_active: false,
          status: am.status === "ACTIVE" ? "ARCHIVED" : am.status,
        })
      }
    }

    // Activate target model
    const updated = await this.updateRecommendationModels({
      id: modelId,
      is_active: true,
      status: "ACTIVE",
    })

    return Array.isArray(updated) ? updated[0] : updated
  }

  async rollbackModel(): Promise<any | null> {
    const [models] = await this.listAndCountRecommendationModels(
      { status: "ARCHIVED" },
      { order: { updated_at: "DESC" }, take: 1 }
    )

    if (models.length === 0) {
      return null
    }

    const previousModel = models[0]
    return await this.activateModel(previousModel.id)
  }

  async listModels(filters: any = {}, config: any = {}): Promise<[any[], number]> {
    return await this.listAndCountRecommendationModels(filters, config)
  }
}
