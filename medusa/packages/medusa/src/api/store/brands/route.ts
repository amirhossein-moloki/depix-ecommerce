import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { StoreGetBrandsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetBrandsParamsType>,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve(Modules.BRAND)
  const queryConfig = req.queryConfig || {
    pagination: { skip: req.validatedQuery?.offset || 0, take: req.validatedQuery?.limit || 20 },
  }

  const filters: Record<string, any> = {
    is_active: true,
  }
  if (req.validatedQuery?.q) {
    filters.q = req.validatedQuery.q
  }

  const [brands, count] = await brandService.listAndCountBrands(
    filters,
    {
      skip: queryConfig.pagination.skip,
      take: queryConfig.pagination.take,
      order: { name: "ASC" },
    }
  )

  res.json({
    brands,
    count,
    offset: queryConfig.pagination.skip,
    limit: queryConfig.pagination.take,
  })
}
