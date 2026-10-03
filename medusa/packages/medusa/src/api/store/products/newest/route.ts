import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve<any>(Modules.PRODUCT)

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

  const [products, count] = await productService.listAndCountProducts(
    {
      status: "published",
    },
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
      relations: ["variants", "categories", "collection", "tags"],
    }
  )

  res.json({
    products,
    count,
    offset,
    limit,
  })
}
