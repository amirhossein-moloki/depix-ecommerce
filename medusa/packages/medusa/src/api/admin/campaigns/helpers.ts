import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const refetchCampaign = async (
  campaignId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "campaign",
    variables: {
      filters: { id: campaignId },
    },
    fields: fields,
  })

  const campaigns = await remoteQuery(queryObject)
  return campaigns[0]
}

/**
 * Moves optional campaign scoping/threshold fields (`product_ids`, `min_purchase_amount`,
 * `max_purchase_amount`, `is_active`) into `metadata` so they persist in `promotion_campaign`.
 */
export function extractCampaignMetadataFields(
  input: Record<string, any>,
  existingMetadata?: Record<string, any> | null
): Record<string, any> {
  const {
    product_ids,
    min_purchase_amount,
    max_purchase_amount,
    is_active,
    metadata,
    ...rest
  } = input

  const mergedMetadata: Record<string, any> = {
    ...(existingMetadata ?? {}),
    ...(metadata ?? {}),
  }

  if (product_ids !== undefined) mergedMetadata.product_ids = product_ids
  if (min_purchase_amount !== undefined) {
    mergedMetadata.min_purchase_amount = min_purchase_amount
  }
  if (max_purchase_amount !== undefined) {
    mergedMetadata.max_purchase_amount = max_purchase_amount
  }
  if (is_active !== undefined) mergedMetadata.is_active = is_active

  if (Object.keys(mergedMetadata).length > 0 || metadata !== undefined) {
    rest.metadata = mergedMetadata
  }

  return rest
}

/**
 * Surfaces campaign scoping/threshold metadata fields at the top level of campaign responses.
 */
export function enrichCampaignResponse<T extends Record<string, any>>(
  campaign: T
): T {
  if (!campaign || typeof campaign !== "object") {
    return campaign
  }
  const meta = (campaign.metadata ?? {}) as Record<string, any>

  return {
    ...campaign,
    product_ids:
      campaign.product_ids !== undefined
        ? campaign.product_ids
        : (meta.product_ids ?? null),
    min_purchase_amount:
      campaign.min_purchase_amount !== undefined
        ? campaign.min_purchase_amount
        : (meta.min_purchase_amount ?? null),
    max_purchase_amount:
      campaign.max_purchase_amount !== undefined
        ? campaign.max_purchase_amount
        : (meta.max_purchase_amount ?? null),
    is_active:
      campaign.is_active !== undefined
        ? Boolean(campaign.is_active)
        : meta.is_active !== undefined
          ? Boolean(meta.is_active)
          : true,
  }
}
