import { MAX_COMPARISON_ITEMS } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve<any>(Modules.PRODUCT)

  const idsQuery = (req.query.ids as string) || ""
  const productIds = idsQuery
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (!productIds.length) {
    return res.json({ products: [], count: 0, max_items: MAX_COMPARISON_ITEMS })
  }

  if (productIds.length > MAX_COMPARISON_ITEMS) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Comparison limit exceeded. Maximum ${MAX_COMPARISON_ITEMS} products allowed.`
    )
  }

  const [products, count] = await productService.listAndCountProducts(
    {
      id: productIds,
      status: "published",
    },
    {
      relations: [
        "variants",
        "categories",
        "collection",
        "type",
        "tags",
        "options",
      ],
    }
  )

  res.json({
    products,
    count,
    max_items: MAX_COMPARISON_ITEMS,
  })
}
