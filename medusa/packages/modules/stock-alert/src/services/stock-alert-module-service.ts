import { MedusaService } from "@medusajs/framework/utils"
import { StockAlert } from "../models"

export default class StockAlertModuleService extends MedusaService({
  StockAlert,
}) {}
