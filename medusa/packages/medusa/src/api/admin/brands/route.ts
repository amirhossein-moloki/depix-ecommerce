import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminCreateBrandType, AdminGetBrandsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetBrandsParamsType>,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const queryConfig = req.queryConfig || {
    pagination: { skip: req.validatedQuery?.offset || 0, take: req.validatedQuery?.limit || 20 },
  }

  const filters: Record<string, any> = {}
  if (req.validatedQuery?.is_active !== undefined) {
    filters.is_active = req.validatedQuery.is_active
  }
  if (req.validatedQuery?.q) {
    filters.q = req.validatedQuery.q
  }

  const [brands, count] = await brandService.listAndCountBrands(
    filters,
    {
      skip: queryConfig.pagination.skip,
      take: queryConfig.pagination.take,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    brands,
    count,
    offset: queryConfig.pagination.skip,
    limit: queryConfig.pagination.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateBrandType>,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const { name, slug, description, logo_id, is_active, metadata } = req.validatedBody

  // Enforce slug uniqueness
  const [existing] = await brandService.listBrands({ slug: slug.toLowerCase() })
  if (existing) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `Brand with slug '${slug}' already exists.`
    )
  }

  // Validate logo_id reference if provided
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

  const brand = await brandService.createBrands({
    name,
    slug: slug.toLowerCase(),
    description: description || null,
    logo_id: logo_id || null,
    is_active: is_active ?? true,
    metadata: metadata || null,
  })

  res.status(201).json({ brand })
}
