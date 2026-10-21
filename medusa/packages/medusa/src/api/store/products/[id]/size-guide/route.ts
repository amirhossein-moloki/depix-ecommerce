import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  const product = await productService.retrieveProduct(id).catch(() => null)
  if (!product || product.status !== "published") {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with ID '${id}' was not found.`
    )
  }

  const [guides] = await sizeGuideService.listProductSizeGuides({ product_id: product.id })
  const size_guide = guides[0] || null

  // Return public size guide payload without administrative metadata
  if (!size_guide) {
    return res.json({ size_guide: null })
  }

  res.json({
    size_guide: {
      id: size_guide.id,
      product_id: size_guide.product_id,
      title: size_guide.title,
      description: size_guide.description,
      columns: size_guide.columns,
      rows: size_guide.rows,
      notes: size_guide.notes,
      image_url: size_guide.image_url,
    },
  })
}
