import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StoreSettingsService } from "../../admin/settings/services/store-settings-service"

export const AUTHENTICATE = false

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = new StoreSettingsService(req.scope)
  const settings = await service.getPublicSettings()
  res.status(200).json(settings)
}
