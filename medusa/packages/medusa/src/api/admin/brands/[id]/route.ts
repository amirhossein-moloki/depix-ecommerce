import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpdateBrandType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const { id } = req.params

  let brand = await brandService.retrieveBrand(id).catch(() => null)
  if (!brand) {
    // Attempt lookup by slug
    const [bySlug] = await brandService.listBrands({ slug: id.toLowerCase() })
    brand = bySlug
  }

  if (!brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with ID or slug '${id}' not found.`
    )
  }

  res.json({ brand })
}

export const PUT = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBrandType>,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const { id } = req.params

  let existing = await brandService.retrieveBrand(id).catch(() => null)
  if (!existing) {
    const [bySlug] = await brandService.listBrands({ slug: id.toLowerCase() })
    existing = bySlug
  }

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with ID or slug '${id}' not found.`
    )
  }

  const { name, slug, description, logo_id, is_active, metadata } = req.validatedBody

  if (slug && slug.toLowerCase() !== existing.slug) {
    const [slugConflict] = await brandService.listBrands({ slug: slug.toLowerCase() })
    if (slugConflict && slugConflict.id !== existing.id) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Brand with slug '${slug}' already exists.`
      )
    }
  }

  if (logo_id) {
    try {
      const mediaService = req.scope.resolve(Modules.MEDIA)
      const media = await mediaService.retrieveMedia(logo_id).catch(() => null)
      if (!media) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Media with ID '${logo_id}' does not exist.`
        )
      }
    } catch (e: any) {
      if (e instanceof MedusaError) throw e
    }
  }

  const updateData: Record<string, any> = {
    id: existing.id,
  }

  if (name !== undefined) updateData.name = name
  if (slug !== undefined) updateData.slug = slug.toLowerCase()
  if (description !== undefined) updateData.description = description
  if (logo_id !== undefined) updateData.logo_id = logo_id
  if (is_active !== undefined) updateData.is_active = is_active
  if (metadata !== undefined) updateData.metadata = metadata

  const updated = await brandService.updateBrands(updateData)

  res.json({ brand: updated })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const { id } = req.params

  const existing = await brandService.retrieveBrand(id).catch(() => null)
  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with ID '${id}' not found.`
    )
  }

  // Check if brand is referenced by products
  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    const [referencedProducts] = await productService.listAndCountProducts({
      $or: [
        { "metadata.brand_id": existing.id },
        { "metadata.brand": existing.name },
        { "metadata.brand_slug": existing.slug },
      ],
    }).catch(() => [[], 0])

    if (referencedProducts && referencedProducts.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cannot delete brand '${existing.name}' because it is referenced by ${referencedProducts.length} product(s). Deactivate it instead.`
      )
    }
  } catch (e: any) {
    if (e instanceof MedusaError) throw e
  }

  await brandService.deleteBrands(existing.id)

  res.json({
    id: existing.id,
    object: "brand",
    deleted: true,
  })
}
