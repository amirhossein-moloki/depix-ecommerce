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
  const id = req.params.id

  try {
    const relationship = await recommendationService.retrieveProductRelationship(
      id
    )
    res.json({ product_relationship: relationship })
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product relationship with id ${id} not found`
    )
  }
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const recommendationService = req.scope.resolve<any>(Modules.RECOMMENDATION)
  const id = req.params.id

  await recommendationService.deleteProductRelationships(id)

  res.json({
    id,
    object: "product_relationship",
    deleted: true,
  })
}
