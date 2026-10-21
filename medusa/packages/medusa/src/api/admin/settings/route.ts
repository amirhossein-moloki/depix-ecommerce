import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StoreSettingsService } from "./services/store-settings-service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = new StoreSettingsService(req.scope)
  const settings = await service.getSettings()
  res.status(200).json(settings)
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = new StoreSettingsService(req.scope)
  const updated = await service.updateSettings(req.body || {})
  res.status(200).json(updated)
}
