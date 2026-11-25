import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  AuthenticationInput,
  IAuthModuleService,
} from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { generateJwtTokenWithChecks } from "../../../auth/utils/generate-jwt-token"
import { formatAdminUser } from "../../users/rbac"

export const AUTHENTICATE = false

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { email, username, password } = (req.validatedBody ?? req.body ?? {}) as {
    email?: string
    username?: string
    password?: string
  }

  const identifier = (email || username || "").trim()
  if (!identifier || !password) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Email/username and password are required."
    )
  }

  const userService = req.scope.resolve<any>(Modules.USER)
  let resolvedEmail = email?.trim()
  let matchedUser: any = null

  if (resolvedEmail) {
    const [byEmail] = await userService
      .listUsers({ email: resolvedEmail.toLowerCase() })
      .catch(() => [])
    matchedUser = byEmail
  } else {
    // Look up by metadata.username first, then fall back to email
    const allUsers = await userService.listUsers({}).catch(() => [])
    matchedUser = (allUsers ?? []).find(
      (u: any) =>
        String(u?.metadata?.username || "").toLowerCase() ===
          identifier.toLowerCase() ||
        String(u?.email || "").toLowerCase() === identifier.toLowerCase()
    )
    resolvedEmail = matchedUser?.email ?? identifier
  }

  const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
  const authData = {
    actor_type: "user",
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: {
      email: resolvedEmail,
      password,
    },
    protocol: req.protocol,
  } as AuthenticationInput

  const { success, error, authIdentity, mfaChallenge } =
    await authService.authenticate("emailpass", authData)

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      error || "Invalid email/username or password"
    )
  }

  const actorId = (authIdentity.app_metadata?.user_id as string) || matchedUser?.id
  if (actorId && !matchedUser) {
    matchedUser = await userService.retrieveUser(actorId).catch(() => null)
  }

  if (matchedUser && matchedUser.metadata?.is_active === false) {
    return res.status(403).json({
      type: "forbidden",
      message: "Admin account is deactivated.",
    })
  }

  const result = await generateJwtTokenWithChecks(req.scope, {
    authIdentity,
    mfaChallenge,
    actorType: "user",
    authProvider: "emailpass",
  })

  return res.status(200).json({
    ...result,
    ...(matchedUser ? { user: formatAdminUser(matchedUser) } : {}),
  })
}
