import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, IAuthModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { formatAdminUser } from "./rbac"
import { AdminCreateUserType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUserListParams>,
  res: MedusaResponse<HttpTypes.AdminUserListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const filters: Record<string, any> = { ...(req.filterableFields ?? {}) }
  const roleFilter = filters.role as string | undefined
  const isActiveFilter = filters.is_active as boolean | undefined
  delete filters.role
  delete filters.is_active

  const hasCustomFilter = roleFilter !== undefined || isActiveFilter !== undefined

  if (!hasCustomFilter) {
    const query = remoteQueryObjectFromString({
      entryPoint: "user",
      variables: {
        filters,
        ...req.queryConfig.pagination,
      },
      fields: req.queryConfig.fields,
    })

    const { rows: users, metadata } = await remoteQuery(query)
    return res.status(200).json({
      users: (users ?? []).map(formatAdminUser),
      count: metadata.count,
      offset: metadata.skip,
      limit: metadata.take,
    })
  }

  const query = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: {
      filters,
      order: req.queryConfig.pagination?.order,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: allUsers = [] } = await remoteQuery(query)
  const filtered = allUsers.map(formatAdminUser).filter((u: any) => {
    if (roleFilter !== undefined && u.role !== roleFilter) {
      return false
    }
    if (isActiveFilter !== undefined && u.is_active !== isActiveFilter) {
      return false
    }
    return true
  })

  const skip = req.queryConfig.pagination?.skip ?? 0
  const take = req.queryConfig.pagination?.take ?? 50
  const paged = filtered.slice(skip, skip + take)

  return res.status(200).json({
    users: paged,
    count: filtered.length,
    offset: skip,
    limit: take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateUserType>,
  res: MedusaResponse
) => {
  const userService = req.scope.resolve<any>(Modules.USER)
  const {
    email,
    name,
    username,
    phone,
    password,
    role,
    is_active,
    first_name,
    last_name,
    avatar_url,
    metadata: extraMetadata,
  } = req.validatedBody

  const normalizedEmail = email.trim().toLowerCase()
  const [existing] = await userService
    .listUsers({ email: normalizedEmail })
    .catch(() => [])

  if (existing) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `User with email '${normalizedEmail}' already exists.`
    )
  }

  const nameParts = (name || "").trim().split(/\s+/).filter(Boolean)
  const resolvedFirstName = first_name ?? nameParts[0] ?? null
  const resolvedLastName =
    last_name ?? (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null)

  const metadata: Record<string, any> = {
    ...(extraMetadata ?? {}),
    name: name ?? ([resolvedFirstName, resolvedLastName].filter(Boolean).join(" ") || normalizedEmail),
    username: username ?? normalizedEmail,
    phone: phone ?? null,
    role: role ?? "admin",
    is_active: is_active ?? true,
  }

  const user = await userService.createUsers({
    email: normalizedEmail,
    first_name: resolvedFirstName,
    last_name: resolvedLastName,
    avatar_url: avatar_url ?? null,
    metadata,
  })

  if (password) {
    const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
    const { success, error, authIdentity } = await authService.register(
      "emailpass",
      {
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: {
          email: normalizedEmail,
          password,
        },
        protocol: req.protocol,
      } as any
    )

    if (!success || !authIdentity) {
      await userService.deleteUsers(user.id).catch(() => null)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error || "Failed to register user credentials"
      )
    }

    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: {
        ...(authIdentity.app_metadata ?? {}),
        user_id: user.id,
      },
    })
  }

  return res.status(201).json({
    user: formatAdminUser(user),
  })
}
