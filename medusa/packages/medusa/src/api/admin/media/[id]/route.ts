import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { deleteFileFromLocalStorage } from "@medusajs/media"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const mediaService = req.scope.resolve(Modules.MEDIA)
  const { id } = req.params

  const media = await mediaService.retrieveMedia(id).catch(() => null)
  if (!media) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Media with ID '${id}' not found.`
    )
  }

  res.json({ media })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const mediaService = req.scope.resolve(Modules.MEDIA)
  const { id } = req.params

  const media = await mediaService.retrieveMedia(id).catch(() => null)
  if (!media) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Media with ID '${id}' not found.`
    )
  }

  // Check usage across Brands
  try {
    const brandService = req.scope.resolve(Modules.BRAND)
    const [brands, brandCount] = await brandService.listAndCountBrands({ logo_id: media.id }).catch(() => [[], 0])
    if (brandCount > 0 || (brands && brands.length > 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Media '${id}' is currently referenced by a brand and cannot be deleted.`
      )
    }
  } catch (e: any) {
    if (e instanceof MedusaError) throw e
  }

  // Check usage across Categories
  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    const [cats, catCount] = await productService.listAndCountProductCategories({
      "metadata.image_id": media.id,
    }).catch(() => [[], 0])
    if (catCount > 0 || (cats && cats.length > 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Media '${id}' is currently referenced by a category and cannot be deleted.`
      )
    }

    // Check usage across Products
    const [prods, prodCount] = await productService.listAndCountProducts({
      $or: [
        { thumbnail: media.url },
        { "metadata.image_id": media.id },
      ],
    }).catch(() => [[], 0])
    if (prodCount > 0 || (prods && prods.length > 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Media '${id}' is currently referenced by a product and cannot be deleted.`
      )
    }
  } catch (e: any) {
    if (e instanceof MedusaError) throw e
  }

  // Delete from DB and disk
  await mediaService.deleteMedia(media.id)
  await deleteFileFromLocalStorage(media.file_key)

  res.json({
    id: media.id,
    object: "media",
    deleted: true,
  })
}
