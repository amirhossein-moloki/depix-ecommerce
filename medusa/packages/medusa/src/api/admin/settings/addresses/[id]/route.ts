import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StoreSettingsService } from "../../services/store-settings-service"

export const PATCH = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service = new StoreSettingsService(req.scope)
  const address = await service.updateAddress(id, req.body || {})
  res.status(200).json({ address })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service = new StoreSettingsService(req.scope)
  const result = await service.deleteAddress(id)
  res.status(200).json(result)
}
