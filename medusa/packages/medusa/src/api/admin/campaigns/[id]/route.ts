import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  deleteCampaignsWorkflow,
  updateCampaignsWorkflow,
} from "@medusajs/core-flows"

import {
  enrichCampaignResponse,
  extractCampaignMetadataFields,
  refetchCampaign,
} from "../helpers"
import { reconcileCartsForPromotionChange } from "../../promotions/reconcile-carts"
import { MedusaError } from "@medusajs/framework/utils"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminGetCampaignParams>,
  res: MedusaResponse<HttpTypes.AdminCampaignResponse>
) => {
  const campaign = await refetchCampaign(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  if (!campaign) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Campaign with id: ${req.params.id} was not found`
    )
  }

  res.status(200).json({ campaign: enrichCampaignResponse(campaign) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdateCampaign & AdditionalData,
    HttpTypes.AdminGetCampaignParams
  >,
  res: MedusaResponse<HttpTypes.AdminCampaignResponse>
) => {
  const existingCampaign = await refetchCampaign(req.params.id, req.scope, [
    "id",
    "metadata",
    "promotions.id",
    "promotions.code",
  ])
  if (!existingCampaign) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Campaign with id "${req.params.id}" not found`
    )
  }

  const { additional_data, ...rest } = req.validatedBody as any
  const updateCampaigns = updateCampaignsWorkflow(req.scope)
  const campaignsData = [
    {
      id: req.params.id,
      ...extractCampaignMetadataFields(rest, existingCampaign.metadata),
    },
  ]

  await updateCampaigns.run({
    input: { campaignsData, additional_data },
  })

  const campaign = await refetchCampaign(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  const promotionIds = (existingCampaign.promotions ?? [])
    .map((p: any) => p?.id)
    .filter((pid: unknown): pid is string => Boolean(pid))
  const promotionCodes = (existingCampaign.promotions ?? [])
    .map((p: any) => p?.code)
    .filter((code: unknown): code is string => Boolean(code))
  await reconcileCartsForPromotionChange(req.scope, {
    promotionIds,
    promotionCodes,
  }).catch(() => undefined)

  res.status(200).json({ campaign: enrichCampaignResponse(campaign) })
}

export const PATCH = POST

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCampaignDeleteResponse>
) => {
  const id = req.params.id
  const existingCampaign = await refetchCampaign(id, req.scope, [
    "id",
    "promotions.id",
    "promotions.code",
  ]).catch(() => null)
  const deleteCampaigns = deleteCampaignsWorkflow(req.scope)

  await deleteCampaigns.run({
    input: { ids: [id] },
  })

  const promotionIds = (existingCampaign?.promotions ?? [])
    .map((p: any) => p?.id)
    .filter((pid: unknown): pid is string => Boolean(pid))
  const promotionCodes = (existingCampaign?.promotions ?? [])
    .map((p: any) => p?.code)
    .filter((code: unknown): code is string => Boolean(code))
  await reconcileCartsForPromotionChange(req.scope, {
    promotionIds,
    promotionCodes,
  }).catch(() => undefined)

  res.status(200).json({
    id,
    object: "campaign",
    deleted: true,
  })
}
