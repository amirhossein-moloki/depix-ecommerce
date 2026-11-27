import { updateUsersWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, UpdateUserDTO } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { refetchUser, syncAdminEmailPassCredentials } from "../helpers"
import { defaultAdminUserFields } from "../query-config"
import { formatAdminUser } from "../rbac"
import { AdminUpdateMeType } from "../validators"

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

export const PATCH = async (
  req: AuthenticatedMedusaRequest<AdminUpdateMeType, HttpTypes.AdminUserParams>,
  res: MedusaResponse<HttpTypes.AdminUserResponse>
) => {
  const id = req.auth_context?.actor_id
  if (!id) {
    return res.status(401).json({
      type: "unauthorized",
      message: "Authentication required",
    } as any)
  }

  const fields =
    req.queryConfig?.fields && req.queryConfig.fields.length > 0
      ? req.queryConfig.fields
      : defaultAdminUserFields

  const existingUser = await refetchUser(id, req.scope, fields)
  if (!existingUser) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `User with id: ${id} was not found`
    )
  }

  const formattedExisting = formatAdminUser(existingUser)
  if (!formattedExisting.is_active) {
    return res.status(403).json({
      type: "forbidden",
      message: "Admin account is deactivated.",
    } as any)
  }

  const {
    name,
    username,
    email,
    phone,
    password,
    metadata: extraMetadata,
    ...directFields
  } = req.validatedBody

  const normalizedEmail = email?.trim()
  if (
    normalizedEmail &&
    normalizedEmail.toLowerCase() !== existingUser.email?.trim().toLowerCase()
  ) {
    try {
      const userService = req.scope.resolve<any>(Modules.USER)
      const conflicts = await userService?.listUsers?.({
        email: normalizedEmail,
      })
      if (
        Array.isArray(conflicts) &&
        conflicts.some((u: any) => u?.id && u.id !== id)
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "ایمیل واردشده قبلاً ثبت شده است."
        )
      }
    } catch (err) {
      if (err instanceof MedusaError) {
        throw err
      }
      // Allow tests without Modules.USER to proceed cleanly
    }
  }

  // Strip privilege-control keys from caller metadata so self-service updates
  // can never escalate role, permissions, or active status.
  const sanitizedExtraMetadata = { ...(extraMetadata ?? {}) }
  delete sanitizedExtraMetadata.role
  delete sanitizedExtraMetadata.is_active
  delete sanitizedExtraMetadata.permissions

  const mergedMetadata: Record<string, any> = {
    ...(existingUser.metadata ?? {}),
    ...sanitizedExtraMetadata,
  }
  if (name !== undefined) mergedMetadata.name = name
  if (username !== undefined) mergedMetadata.username = username
  if (phone !== undefined) mergedMetadata.phone = phone

  await updateUsersWorkflow(req.scope).run({
    input: {
      updates: [
        {
          id,
          ...directFields,
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
          metadata: mergedMetadata,
        } as UpdateUserDTO,
      ],
    },
  })

  await syncAdminEmailPassCredentials(req.scope, {
    previousEmail: existingUser.email,
    nextEmail: normalizedEmail ?? existingUser.email,
    password,
  })

  const updatedUser = await refetchUser(id, req.scope, fields)

  return res.status(200).json({ user: formatAdminUser(updatedUser) })
}

export const POST = PATCH
