import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const { id } = req.params

  let brand = await brandService.retrieveBrand(id).catch(() => null)
  if (!brand) {
    const [bySlug] = await brandService.listBrands({ slug: id.toLowerCase() })
    brand = bySlug
  }

  if (!brand || !brand.is_active) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with ID or slug '${id}' not found.`
    )
  }

  res.json({ brand })
}
