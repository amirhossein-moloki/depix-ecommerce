import { MedusaService } from "@medusajs/framework/utils"
import { ProductRelationship } from "../models"

export default class RecommendationModuleService extends MedusaService({
  ProductRelationship,
}) {}
