import { MedusaService } from "@medusajs/framework/utils"
import { Comparison, ComparisonItem } from "../models"

export default class ComparisonModuleService extends MedusaService({
  Comparison,
  ComparisonItem,
}) {}
