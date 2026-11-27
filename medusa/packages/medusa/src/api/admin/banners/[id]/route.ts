import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpdateBannerType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const banner = await bannerService
    .retrieveBanner(req.params.id)
    .catch(() => null)

  if (!banner) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Banner with id '${req.params.id}' not found`
    )
  }

  res.status(200).json({ banner })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBannerType>,
  res: MedusaResponse
) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const existing = await bannerService
    .retrieveBanner(req.params.id)
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Banner with id '${req.params.id}' not found`
    )
  }

  const updated = await bannerService.updateBanners({
    id: req.params.id,
    ...req.validatedBody,
  })

  const banner = Array.isArray(updated) ? updated[0] : updated
  res.status(200).json({ banner })
}

export const POST = PATCH

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const bannerService = req.scope.resolve<any>(Modules.BANNER)
  const existing = await bannerService
    .retrieveBanner(req.params.id)
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Banner with id '${req.params.id}' not found`
    )
  }

  await bannerService.deleteBanners(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "banner",
    deleted: true,
  })
}
