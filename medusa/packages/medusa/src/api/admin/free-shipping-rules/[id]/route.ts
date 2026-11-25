import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpdateFreeShippingRuleType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const promotionService = req.scope.resolve<any>(Modules.PROMOTION)
  const { id } = req.params

  const free_shipping_rule = await promotionService
    .retrieveFreeShippingRule(id)
    .catch(() => null)

  if (!free_shipping_rule) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Free shipping rule with ID '${id}' not found.`
    )
  }

  res.json({ free_shipping_rule })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<AdminUpdateFreeShippingRuleType>,
  res: MedusaResponse
) => {
  const promotionService = req.scope.resolve<any>(Modules.PROMOTION)
  const { id } = req.params

  const existing = await promotionService
    .retrieveFreeShippingRule(id)
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Free shipping rule with ID '${id}' not found.`
    )
  }

  const free_shipping_rule = await promotionService.updateFreeShippingRules({
    id,
    ...req.validatedBody,
  })

  res.json({ free_shipping_rule })
}

export const POST = PATCH

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const promotionService = req.scope.resolve<any>(Modules.PROMOTION)
  const { id } = req.params

  const existing = await promotionService
    .retrieveFreeShippingRule(id)
    .catch(() => null)

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Free shipping rule with ID '${id}' not found.`
    )
  }

  await promotionService.deleteFreeShippingRules(id)

  res.json({
    id,
    object: "free_shipping_rule",
    deleted: true,
  })
}
