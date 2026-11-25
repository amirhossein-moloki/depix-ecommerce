import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { formatAdminUser } from "../rbac"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUserParams>,
  res: MedusaResponse<HttpTypes.AdminUserResponse>
) => {
  const id = req.auth_context?.actor_id
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  if (!id) {
    return res.status(401).json({
      type: "unauthorized",
      message: "Authentication required",
    } as any)
  }

  const query = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: { id },
    fields: req.queryConfig.fields,
  })

  const [user] = await remoteQuery(query)

  if (!user) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `User with id: ${id} was not found`
    )
  }

  const formatted = formatAdminUser(user)
  if (!formatted.is_active) {
    return res.status(403).json({
      type: "forbidden",
      message: "Admin account is deactivated.",
    } as any)
  }

  return res.status(200).json({ user: formatted })
}
