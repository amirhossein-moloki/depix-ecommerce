import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { StoreGetCategoriesParamsType } from "./validators"
import { formatCategory } from "../../admin/categories/route"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetCategoriesParamsType>,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT)
  const queryConfig = req.queryConfig || {
    pagination: { skip: req.validatedQuery?.offset || 0, take: req.validatedQuery?.limit || 20 },
  }

  const filters: Record<string, any> = {
    is_active: true,
    is_internal: false,
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
      order: { rank: "ASC" },
    }
  )

  res.json({
    categories: categories.map(formatCategory),
    count,
    offset: queryConfig.pagination.skip,
    limit: queryConfig.pagination.take,
  })
}
