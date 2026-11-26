import {
  BatchMethodResponse,
  BatchResponse,
  MedusaContainer,
  PromotionRuleDTO,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  promiseAll,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const refetchPromotion = async (
  promotionId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "promotion",
    variables: {
      filters: { id: promotionId },
    },
    fields: fields,
  })

  const promotions = await remoteQuery(queryObject)
  return promotions[0]
}

/**
 * Moves optional display/scheduling fields (title, description, starts_at, ends_at, usage_limit)
 * into promotion metadata while preserving existing metadata and mapping usage_limit to limit.
 */
export function extractPromotionMetadataFields(
  input: Record<string, any>,
  existingMetadata?: Record<string, any> | null
): Record<string, any> {
  const {
    title,
    description,
    starts_at,
    ends_at,
    usage_limit,
    metadata,
    ...rest
  } = input

  const mergedMetadata: Record<string, any> = {
    ...(existingMetadata ?? {}),
    ...(metadata ?? {}),
  }

  if (title !== undefined) mergedMetadata.title = title
  if (description !== undefined) mergedMetadata.description = description
  if (starts_at !== undefined) {
    mergedMetadata.starts_at =
      starts_at instanceof Date ? starts_at.toISOString() : starts_at
  }
  if (ends_at !== undefined) {
    mergedMetadata.ends_at =
      ends_at instanceof Date ? ends_at.toISOString() : ends_at
  }
  if (usage_limit !== undefined) mergedMetadata.usage_limit = usage_limit

  if (
    usage_limit !== undefined &&
    rest.limit === undefined &&
    !rest.is_automatic
  ) {
    rest.limit = usage_limit
  }

  if (Object.keys(mergedMetadata).length > 0 || metadata !== undefined) {
    rest.metadata = mergedMetadata
  }

  return rest
}

/**
 * Surfaces metadata display/scheduling fields and used_count at the top level of a promotion response.
 */
export function enrichPromotionResponse<T extends Record<string, any>>(
  promotion: T
): T {
  if (!promotion || typeof promotion !== "object") {
    return promotion
  }
  const meta = (promotion.metadata ?? {}) as Record<string, any>
  const usedCount = Number(
    promotion.used_count ??
      promotion.used ??
      promotion.campaign?.budget?.used ??
      meta.used_count ??
      0
  )

  return {
    ...promotion,
    title: promotion.title ?? meta.title ?? null,
    description: promotion.description ?? meta.description ?? null,
    starts_at:
      promotion.starts_at ??
      meta.starts_at ??
      promotion.campaign?.starts_at ??
      null,
    ends_at:
      promotion.ends_at ?? meta.ends_at ?? promotion.campaign?.ends_at ?? null,
    usage_limit:
      promotion.usage_limit ?? promotion.limit ?? meta.usage_limit ?? null,
    used_count: usedCount,
  }
}

export const refetchBatchRules = async (
  batchResult: BatchMethodResponse<PromotionRuleDTO>,
  scope: MedusaContainer,
  fields: string[]
): Promise<BatchResponse<PromotionRuleDTO>> => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  let created = Promise.resolve<PromotionRuleDTO[]>([])
  let updated = Promise.resolve<PromotionRuleDTO[]>([])

  if (batchResult.created.length) {
    const createdQuery = remoteQueryObjectFromString({
      entryPoint: "promotion_rule",
      variables: {
        filters: { id: batchResult.created.map((p) => p.id) },
      },
      fields: fields,
    })

    created = remoteQuery(createdQuery)
  }

  if (batchResult.updated.length) {
    const updatedQuery = remoteQueryObjectFromString({
      entryPoint: "promotion_rule",
      variables: {
        filters: { id: batchResult.updated.map((p) => p.id) },
      },
      fields: fields,
    })

    updated = remoteQuery(updatedQuery)
  }

  const [createdRes, updatedRes] = await promiseAll([created, updated])
  return {
    created: createdRes,
    updated: updatedRes,
    deleted: {
      ids: batchResult.deleted,
      object: "promotion-rule",
      deleted: true,
    },
  }
}
