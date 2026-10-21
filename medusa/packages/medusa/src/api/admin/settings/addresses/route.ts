import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StoreSettingsService } from "../services/store-settings-service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = new StoreSettingsService(req.scope)
  const settings = await service.getSettings()
  res.status(200).json({
    addresses: settings.addresses,
    defaultShippingAddressId: settings.defaultShippingAddressId,
    defaultReturnAddressId: settings.defaultReturnAddressId,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = new StoreSettingsService(req.scope)
  const address = await service.createAddress(req.body || {})
  res.status(201).json({ address })
}
