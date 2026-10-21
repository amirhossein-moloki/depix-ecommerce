import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { formatCategory } from "../../../admin/categories/route"

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

  if (!category || !category.is_active || category.is_internal) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Category with ID or slug '${id}' not found.`
    )
  }

  res.json({ category: formatCategory(category) })
}
