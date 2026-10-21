import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AdminGetMediaParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMediaParamsType>,
  res: MedusaResponse
) => {
  const mediaService = req.scope.resolve(Modules.MEDIA)
  const queryConfig = req.queryConfig || {
    pagination: { skip: req.validatedQuery?.offset || 0, take: req.validatedQuery?.limit || 20 },
  }

  const filters: Record<string, any> = {}
  if (req.validatedQuery?.q) {
    filters.q = req.validatedQuery.q
  }
  if (req.validatedQuery?.mime_type) {
    filters.mime_type = req.validatedQuery.mime_type
  }
  if (req.validatedQuery?.uploaded_by_id) {
    filters.uploaded_by_id = req.validatedQuery.uploaded_by_id
  }

  const orderDirection =
    req.validatedQuery?.order === "ASC" || req.validatedQuery?.order === "created_at"
      ? "ASC"
      : "DESC"

  const [media, count] = await mediaService.listAndCountMedia(
    filters,
    {
      skip: queryConfig.pagination.skip,
      take: queryConfig.pagination.take,
      order: { created_at: orderDirection },
    }
  )

  res.json({
    media,
    count,
    offset: queryConfig.pagination.skip,
    limit: queryConfig.pagination.take,
  })
}
