import { z } from "@medusajs/framework/zod"
import { booleanString } from "../../utils/common-validators/common"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../utils/validators"
import { ADMIN_ROLES } from "./rbac"

export const AdminRoleEnum = z.enum(ADMIN_ROLES)

export const AdminGetUserParams = createSelectParams()

export type AdminGetUsersParamsType = z.infer<typeof AdminGetUsersParams>
export const AdminGetUsersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    deleted_at: createOperatorMap().optional(),
    email: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    role: AdminRoleEnum.optional(),
    is_active: booleanString().optional(),
  })
)

export type AdminCreateUserType = z.infer<typeof AdminCreateUser>
export const AdminCreateUser = z.object({
  email: z.string().email(),
  name: z.string().nullish(),
  username: z.string().nullish(),
  phone: z.string().nullish(),
  password: z.string().min(6).optional(),
  role: AdminRoleEnum.default("admin"),
  is_active: z.boolean().default(true),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish().optional(),
})

export type AdminUpdateUserType = z.infer<typeof AdminUpdateUser>
export const AdminUpdateUser = z.object({
  name: z.string().nullish(),
  username: z.string().nullish(),
  email: z.string().email().optional(),
  phone: z.string().nullish(),
  password: z.string().min(6).optional(),
  role: AdminRoleEnum.optional(),
  is_active: z.boolean().optional(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish().optional(),
})

export type AdminAssignUserRolesType = z.infer<typeof AdminAssignUserRoles>
export const AdminAssignUserRoles = z.object({
  roles: z.array(z.string().min(1)).min(1),
})

export type AdminRemoveUserRolesType = z.infer<typeof AdminRemoveUserRoles>
export const AdminRemoveUserRoles = z.object({
  roles: z.array(z.string().min(1)).min(1),
})

export const AdminGetUserRolesParamsFields = z.object({
  role_id: z.union([z.string(), z.array(z.string())]).optional(),
})

export type AdminGetUserRolesParamsType = z.infer<
  typeof AdminGetUserRolesParams
>
export const AdminGetUserRolesParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(AdminGetUserRolesParamsFields)
