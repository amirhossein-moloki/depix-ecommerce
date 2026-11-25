import {
  removeUserAccountWorkflow,
  updateUsersWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, IAuthModuleService, UpdateUserDTO } from "@medusajs/framework/types"

import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { refetchUser } from "../helpers"
import { formatAdminUser } from "../rbac"
import { AdminUpdateUserType } from "../validators"

// Get user
export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUserParams>,
  res: MedusaResponse<HttpTypes.AdminUserResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const { id } = req.params

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

  res.status(200).json({ user: formatAdminUser(user) })
}

// update user
export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminUpdateUserType,
    HttpTypes.AdminUserParams
  >,
  res: MedusaResponse<HttpTypes.AdminUserResponse>
) => {
  const existingUser = await refetchUser(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )
  if (!existingUser) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `User with id: ${req.params.id} was not found`
    )
  }

  const {
    name,
    username,
    phone,
    role,
    is_active,
    password,
    metadata: extraMetadata,
    ...directFields
  } = req.validatedBody

  const mergedMetadata: Record<string, any> = {
    ...(existingUser.metadata ?? {}),
    ...(extraMetadata ?? {}),
  }
  if (name !== undefined) mergedMetadata.name = name
  if (username !== undefined) mergedMetadata.username = username
  if (phone !== undefined) mergedMetadata.phone = phone
  if (role !== undefined) mergedMetadata.role = role
  if (is_active !== undefined) mergedMetadata.is_active = is_active

  const workflow = updateUsersWorkflow(req.scope)

  const input = {
    updates: [
      {
        id: req.params.id,
        ...directFields,
        metadata: mergedMetadata,
      } as UpdateUserDTO,
    ],
  }

  await workflow.run({ input })

  if (password) {
    const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
    await authService.updateProvider("emailpass", {
      entity_id: existingUser.email,
      password,
    })
  }

  const user = await refetchUser(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ user: formatAdminUser(user) })
}

export const PATCH = POST

// delete user
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminUserDeleteResponse>
) => {
  const { id } = req.params
  const { actor_id } = req.auth_context

  if (actor_id === id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "A user cannot delete itself"
    )
  }

  const workflow = removeUserAccountWorkflow(req.scope)

  await workflow.run({
    input: { userId: id },
  })

  res.status(200).json({
    id,
    object: "user",
    deleted: true,
  })
}
