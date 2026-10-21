import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpsertProductSizeGuideType } from "../../../size-guides/validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  // Verify product exists
  const product = await productService.retrieveProduct(id).catch(() => null)
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with ID '${id}' not found.`
    )
  }

  const [guides] = await sizeGuideService.listProductSizeGuides({ product_id: id })
  const size_guide = guides[0] || null

  res.json({ size_guide })
}

export const PUT = async (
  req: AuthenticatedMedusaRequest<AdminUpsertProductSizeGuideType>,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  // Verify product exists
  const product = await productService.retrieveProduct(id).catch(() => null)
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with ID '${id}' not found.`
    )
  }

  const {
    title,
    description,
    columns,
    rows,
    notes,
    source_template_id,
    image_id,
    image_url,
    metadata,
  } = req.validatedBody

  // Check if cloning from template directly
  if (source_template_id && (!columns || columns.length === 0)) {
    const cloned = await sizeGuideService.cloneTemplateToProductGuide(
      id,
      source_template_id,
      {
        title,
        description: description || undefined,
        notes: notes || undefined,
        image_id: image_id || undefined,
        image_url: image_url || undefined,
      }
    )
    return res.json({ size_guide: cloned })
  }

  // Otherwise, custom or direct guide
  const effectiveColumns = columns || []
  const effectiveRows = rows || []

  const validated = sizeGuideService.validateSizeGuideData(
    effectiveColumns,
    effectiveRows
  )

  const [existingList] = await sizeGuideService.listProductSizeGuides({
    product_id: id,
  })
  const existing = existingList[0]

  const payload: Record<string, any> = {
    product_id: id,
    title: title || existing?.title || product.title || "راهنمای سایز",
    description: description !== undefined ? description : existing?.description ?? null,
    columns: validated.columns,
    rows: validated.rows,
    notes: notes !== undefined ? notes : existing?.notes ?? null,
    source_template_id: source_template_id !== undefined ? source_template_id : existing?.source_template_id ?? null,
    image_id: image_id !== undefined ? image_id : existing?.image_id ?? null,
    image_url: image_url !== undefined ? image_url : existing?.image_url ?? null,
    metadata: metadata !== undefined ? metadata : existing?.metadata ?? null,
  }

  let result
  if (existing) {
    result = await sizeGuideService.updateProductSizeGuides({
      id: existing.id,
      ...payload,
    })
  } else {
    result = await sizeGuideService.createProductSizeGuides(payload)
  }

  res.json({ size_guide: result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  // Verify product exists
  const product = await productService.retrieveProduct(id).catch(() => null)
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with ID '${id}' not found.`
    )
  }

  const [guides] = await sizeGuideService.listProductSizeGuides({ product_id: id })
  const existing = guides[0]

  if (existing) {
    await sizeGuideService.deleteProductSizeGuides(existing.id)
    return res.json({
      id: existing.id,
      object: "product_size_guide",
      deleted: true,
    })
  }

  res.json({
    id: null,
    object: "product_size_guide",
    deleted: false,
  })
}
