import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpdateSizeGuideTemplateType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  const template = await sizeGuideService
    .retrieveSizeGuideTemplate(id)
    .catch(() => null)

  if (!template) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Size guide template with ID '${id}' not found.`
    )
  }

  res.json({ size_guide_template: template })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSizeGuideTemplateType>,
  res: MedusaResponse
) => {
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  const existing = await sizeGuideService
    .retrieveSizeGuideTemplate(id)
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Size guide template with ID '${id}' not found.`
    )
  }

  const { name, description, columns, rows, notes, is_active, metadata } = req.validatedBody

  const updatedColumns = columns ?? existing.columns
  const updatedRows = rows ?? existing.rows

  // Validate structural integrity of columns and rows
  const validated = sizeGuideService.validateSizeGuideData(updatedColumns, updatedRows)

  const updateData: Record<string, any> = {
    id: existing.id,
    columns: validated.columns,
    rows: validated.rows,
  }

  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (notes !== undefined) updateData.notes = notes
  if (is_active !== undefined) updateData.is_active = is_active
  if (metadata !== undefined) updateData.metadata = metadata

  const updated = await sizeGuideService.updateSizeGuideTemplates(updateData)

  res.json({ size_guide_template: updated })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { id } = req.params

  const existing = await sizeGuideService
    .retrieveSizeGuideTemplate(id)
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Size guide template with ID '${id}' not found.`
    )
  }

  // Safety check: check if any ProductSizeGuide references this template
  const [referenced] = await sizeGuideService
    .listProductSizeGuides({ source_template_id: existing.id })
    .catch(() => [[], 0])

  if (referenced && referenced.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot delete size guide template '${existing.name}' because it is assigned to ${referenced.length} product(s). Deactivate it instead.`
    )
  }

  await sizeGuideService.deleteSizeGuideTemplates(existing.id)

  res.json({
    id: existing.id,
    object: "size_guide_template",
    deleted: true,
  })
}
