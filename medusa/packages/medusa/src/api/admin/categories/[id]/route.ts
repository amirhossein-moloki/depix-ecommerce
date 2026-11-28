import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ProductTypes } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpdateCategoryType } from "../validators"
import { formatCategory } from "../route"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
  const { id } = req.params

  let category = await productService.retrieveProductCategory(id).catch(() => null)
  if (!category) {
    const [byHandle] = await productService.listProductCategories({ handle: id.toLowerCase() })
    category = byHandle
  }

  if (!category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Category with ID or slug '${id}' not found.`
    )
  }

  res.json({ category: formatCategory(category) })
}

export const PUT = async (
  req: AuthenticatedMedusaRequest<AdminUpdateCategoryType>,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
  const { id } = req.params

  let existing = await productService.retrieveProductCategory(id).catch(() => null)
  if (!existing) {
    const [byHandle] = await productService.listProductCategories({ handle: id.toLowerCase() })
    existing = byHandle
  }

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Category with ID or slug '${id}' not found.`
    )
  }

  const {
    name,
    slug,
    description,
    image_id,
    is_active,
    display_order,
    rank,
    parent_category_id,
    metadata,
  } = req.validatedBody

  // Prevent self-parenting
  if (parent_category_id !== undefined && parent_category_id === existing.id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Category cannot be its own parent."
    )
  }

  // Prevent circular parent relationships
  if (parent_category_id) {
    let currParentId: string | null = parent_category_id
    const visited = new Set<string>()
    while (currParentId) {
      if (currParentId === existing.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Circular category parent relationship detected."
        )
      }
      if (visited.has(currParentId)) break
      visited.add(currParentId)

      const parentCat: any = await productService
        .retrieveProductCategory(currParentId)
        .catch(() => null)

      if (!parentCat) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Parent category with ID '${currParentId}' does not exist.`
        )
      }
      currParentId = parentCat.parent_category_id || null
    }
  }

  // Check handle uniqueness if slug is updated
  if (slug && slug.toLowerCase() !== existing.handle) {
    const [slugConflict] = await productService.listProductCategories({
      handle: slug.toLowerCase(),
    })
    if (slugConflict && slugConflict.id !== existing.id) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Category with slug '${slug}' already exists.`
      )
    }
  }

  // Validate image_id if updated
  if (image_id) {
    try {
      const mediaService = req.scope.resolve<any>(Modules.MEDIA)
      const media = await mediaService.retrieveMedia(image_id).catch(() => null)
      if (!media) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Media with ID '${image_id}' does not exist.`
        )
      }
    } catch (e: any) {
      if (e instanceof MedusaError) throw e
    }
  }

  const updateData: ProductTypes.UpdateProductCategoryDTO = {}

  if (name !== undefined) updateData.name = name
  if (slug !== undefined) updateData.handle = slug.toLowerCase()
  if (description !== undefined) updateData.description = description
  if (is_active !== undefined) updateData.is_active = is_active
  if (rank !== undefined || display_order !== undefined) {
    updateData.rank = rank ?? display_order
  }
  if (parent_category_id !== undefined) {
    updateData.parent_category_id = parent_category_id
  }

  if (metadata !== undefined || image_id !== undefined) {
    updateData.metadata =
      metadata === null && image_id === undefined
        ? null
        : {
            ...(metadata === null ? {} : existing.metadata || {}),
            ...(metadata || {}),
            ...(image_id !== undefined ? { image_id } : {}),
          }
  }

  const updatedResult = await productService.updateProductCategories(
    existing.id,
    updateData
  )

  let updatedCategory: any = Array.isArray(updatedResult)
    ? updatedResult.find((item: any) => item?.id === existing.id) ??
      updatedResult[0]
    : updatedResult

  if (
    !updatedCategory ||
    typeof updatedCategory !== "object" ||
    !updatedCategory.id
  ) {
    const refetched = await productService
      .retrieveProductCategory(existing.id)
      .catch(() => null)

    if (refetched && refetched.id) {
      updatedCategory = refetched
    } else {
      const partial =
        updatedCategory &&
        typeof updatedCategory === "object" &&
        !Array.isArray(updatedCategory)
          ? updatedCategory
          : {}
      updatedCategory = {
        ...existing,
        ...updateData,
        ...partial,
        id: existing.id,
      }
    }
  }

  res.json({ category: formatCategory(updatedCategory) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
  const { id } = req.params

  const existing = await productService.retrieveProductCategory(id).catch(() => null)
  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Category with ID '${id}' not found.`
    )
  }

  // Delete category while preserving product records
  await (productService as any).deleteProductCategories(existing.id)

  res.json({
    id: existing.id,
    object: "category",
    deleted: true,
  })
}
