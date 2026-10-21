import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  AdminCreateSizeGuideTemplateType,
  AdminGetSizeGuideTemplatesParamsType,
} from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetSizeGuideTemplatesParamsType>,
  res: MedusaResponse
) => {
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
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

  const [size_guide_templates, count] = await sizeGuideService.listAndCountSizeGuideTemplates(
    filters,
    {
      skip: queryConfig.pagination.skip,
      take: queryConfig.pagination.take,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    size_guide_templates,
    count,
    offset: queryConfig.pagination.skip,
    limit: queryConfig.pagination.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateSizeGuideTemplateType>,
  res: MedusaResponse
) => {
  const sizeGuideService = req.scope.resolve(Modules.SIZE_GUIDE) as any
  const { name, description, columns, rows, notes, is_active, metadata } = req.validatedBody

  // Validate structural integrity of columns and rows
  const validated = sizeGuideService.validateSizeGuideData(columns, rows)

  const template = await sizeGuideService.createSizeGuideTemplates({
    name,
    description: description || null,
    columns: validated.columns,
    rows: validated.rows,
    notes: notes || null,
    is_active: is_active ?? true,
    metadata: metadata || null,
  })

  res.status(201).json({ size_guide_template: template })
}
