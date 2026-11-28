import {
  deletePromotionsWorkflow,
  updatePromotionsWorkflow,
} from "@medusajs/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  enrichPromotionResponse,
  extractPromotionMetadataFields,
  refetchPromotion,
} from "../helpers"
import { reconcileCartsForPromotionChange } from "../reconcile-carts"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminGetPromotionParams>,
  res: MedusaResponse<HttpTypes.AdminPromotionResponse>
) => {
  const idOrCode = req.params.id
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "promotion",
    variables: {
      filters: { $or: [{ id: idOrCode }, { code: idOrCode }] },
    },
    fields: req.queryConfig.fields,
  })

  const [promotion] = await remoteQuery(queryObject)
  if (!promotion) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Promotion with id or code: ${idOrCode} was not found`
    )
  }

  res.status(200).json({ promotion: enrichPromotionResponse(promotion) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdatePromotion & AdditionalData,
    HttpTypes.AdminGetPromotionParams
  >,
  res: MedusaResponse<HttpTypes.AdminPromotionResponse>
) => {
  const { additional_data, ...rest } = req.validatedBody
  const existing = await refetchPromotion(
    req.params.id,
    req.scope,
    ["id", "code", "status", "metadata"]
  ).catch(() => null)

  const updatePromotions = updatePromotionsWorkflow(req.scope)
  const promotionsData = [
    {
      id: req.params.id,
      ...extractPromotionMetadataFields(rest, existing?.metadata),
    } as any,
  ]

  await updatePromotions.run({
    input: { promotionsData, additional_data },
  })

  const promotion = await refetchPromotion(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  const promotionCodes = [existing?.code, promotion?.code].filter(
    (code): code is string => Boolean(code)
  )
  await reconcileCartsForPromotionChange(req.scope, {
    promotionIds: [req.params.id],
    promotionCodes,
  }).catch(() => undefined)

  res.status(200).json({ promotion: enrichPromotionResponse(promotion) })
}

export const PATCH = POST

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPromotionDeleteResponse>
) => {
  const id = req.params.id
  const existing = await refetchPromotion(id, req.scope, ["id", "code"]).catch(
    () => null
  )
  const deletePromotions = deletePromotionsWorkflow(req.scope)

  await deletePromotions.run({
    input: { ids: [id] },
  })

  await reconcileCartsForPromotionChange(req.scope, {
    promotionIds: [id],
    promotionCodes: existing?.code ? [existing.code] : [],
  }).catch(() => undefined)

  res.status(200).json({
    id,
    object: "promotion",
    deleted: true,
  })
}
