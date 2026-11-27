import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminReorderBannersType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminReorderBannersType>,
  res: MedusaResponse
) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const body = req.validatedBody

  const items = Array.isArray(body)
    ? body
    : "items" in body
      ? body.items
      : body.banners

  const updated = await bannerService.updateBanners(
    items.map((item) => ({
      id: item.id,
      sort_order: item.sort_order,
    }))
  )

  const banners = Array.isArray(updated) ? updated : [updated]
  res.status(200).json({ banners })
}
