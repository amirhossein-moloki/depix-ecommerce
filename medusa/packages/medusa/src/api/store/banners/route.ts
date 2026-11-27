import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { BannerPlacementSchema } from "../../admin/banners/validators"

/**
 * @oas [get] /store/banners
 * operationId: "StoreListBanners"
 * summary: "List Active Storefront Banners"
 * description: "Returns active banners sorted by sort_order ASC, created_at ASC. Optionally filtered by placement."
 * x-authenticated: false
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const rawPlacement = req.query?.placement

  const filters: Record<string, any> = { is_active: true }
  if (rawPlacement !== undefined && rawPlacement !== "") {
    const parsed = BannerPlacementSchema.safeParse(rawPlacement)
    if (!parsed.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "placement must be one of: hero_main, hero_secondary"
      )
    }
    filters.placement = parsed.data
  }

  const banners = await bannerService.listBanners(filters, {
    order: { sort_order: "ASC", created_at: "ASC" },
  })

  res.status(200).json({ banners: banners ?? [] })
}
