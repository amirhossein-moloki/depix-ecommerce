import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { StoreSettingsService } from "../services/store-settings-service"

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = new StoreSettingsService(req.scope)
  const addressId = req.body?.addressId || req.body?.address_id
  if (!addressId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "addressId is required.")
  }
  const settings = await service.setDefaultReturnAddress(addressId)
  res.status(200).json(settings)
}
