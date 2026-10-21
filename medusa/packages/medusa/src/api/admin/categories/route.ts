import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules, kebabCase } from "@medusajs/framework/utils"
import {
  AdminCreateCategoryType,
  AdminGetCategoriesParamsType,
} from "./validators"

export function formatCategory(cat: any) {
  if (!cat) return null
  const metadata = cat.metadata || {}
  return {
    ...cat,
    slug: cat.handle || metadata.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    image_id: metadata.image_id || cat.image || null,
    display_order: cat.rank ?? 0,
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetCategoriesParamsType>,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
  const queryConfig = req.queryConfig || {
    pagination: { skip: req.validatedQuery?.offset || 0, take: req.validatedQuery?.limit || 20 },
  }

  const filters: Record<string, any> = {}
  if (req.validatedQuery?.is_active !== undefined) {
    filters.is_active = req.validatedQuery.is_active
  }
  if (req.validatedQuery?.parent_category_id !== undefined) {
    filters.parent_category_id = req.validatedQuery.parent_category_id
  }
  if (req.validatedQuery?.q) {
    filters.q = req.validatedQuery.q
  }

  const [categories, count] = await productService.listAndCountProductCategories(
    filters,
    {
      skip: queryConfig.pagination.skip,
      take: queryConfig.pagination.take,
      order: { rank: "ASC", created_at: "DESC" },
    }
  )

  res.json({
    categories: categories.map(formatCategory),
    count,
    offset: queryConfig.pagination.skip,
    limit: queryConfig.pagination.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCategoryType>,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
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

  const handle = (slug || kebabCase(name)).toLowerCase()

  // Enforce slug uniqueness
  const [existingHandle] = await productService.listProductCategories({ handle })
  if (existingHandle) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `Category with slug '${handle}' already exists.`
    )
  }

  // Validate parent category if specified
  if (parent_category_id) {
    const parentCat = await productService
      .retrieveProductCategory(parent_category_id)
      .catch(() => null)
    if (!parentCat) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Parent category with ID '${parent_category_id}' does not exist.`
      )
    }
  }

  // Validate image_id if provided
  if (image_id) {
    try {
      const mediaService = req.scope.resolve(Modules.MEDIA)
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

  const mergedMetadata = {
    ...(metadata || {}),
    ...(image_id ? { image_id } : {}),
  }

  const newCategory = await productService.createProductCategories({
    name,
    handle,
    description: description || "",
    is_active: is_active ?? true,
    rank: rank ?? display_order ?? 0,
    parent_category_id: parent_category_id || null,
    metadata: mergedMetadata,
  })

  res.status(201).json({ category: formatCategory(newCategory) })
}
