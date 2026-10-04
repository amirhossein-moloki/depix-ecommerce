import { MedusaService } from "@medusajs/framework/utils"
import PriceAlert from "../models/price-alert"

class PriceAlertModuleService extends MedusaService({
  PriceAlert,
}) {}

export default PriceAlertModuleService
