import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  AdminCreateBannerType,
  BannerPlacementSchema,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const rawPlacement = req.query?.placement

  const filters: Record<string, any> = {}
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

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateBannerType>,
  res: MedusaResponse
) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const {
    title,
    placement,
    image_url,
    link_url,
    sort_order,
    is_active,
    metadata,
  } = req.validatedBody

  const created = await bannerService.createBanners({
    title: title ?? null,
    placement,
    image_url,
    link_url: link_url ?? null,
    sort_order,
    is_active,
    metadata: metadata ?? null,
  })

  const banner = Array.isArray(created) ? created[0] : created
  res.status(201).json({ banner })
}
