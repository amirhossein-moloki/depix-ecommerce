import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const recommendationService = req.scope.resolve<any>(Modules.RECOMMENDATION)
  const sourceProductId = req.query.source_product_id as string | undefined
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0

  const filters: any = {}
  if (sourceProductId) {
    filters.source_product_id = sourceProductId
  }

  const [relationships, count] =
    await recommendationService.listAndCountProductRelationships(filters, {
      take: limit,
      skip: offset,
    })

  res.json({
    product_relationships: relationships,
    count,
    limit,
    offset,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const recommendationService = req.scope.resolve<any>(Modules.RECOMMENDATION)
  const body = req.body as any

  if (!body.source_product_id || !body.related_product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "source_product_id and related_product_id are required"
    )
  }

  const relationship = await recommendationService.createProductRelationships({
    source_product_id: body.source_product_id,
    related_product_id: body.related_product_id,
    relationship_type: body.relationship_type || "RELATED",
    priority: body.priority ?? 0,
    is_active: body.is_active ?? true,
    metadata: body.metadata || null,
  })

  res.status(201).json({
    product_relationship: relationship,
  })
}
