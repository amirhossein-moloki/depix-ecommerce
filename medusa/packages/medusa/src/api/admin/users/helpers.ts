import { IAuthModuleService, MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const refetchUser = async (
  userId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: {
      filters: { id: userId },
    },
    fields: fields,
  })

  const users = await remoteQuery(queryObject)
  return users[0]
}

/**
 * Keeps `emailpass` auth provider identities and passwords synchronized
 * when an admin user updates their email or password.
 */
export async function syncAdminEmailPassCredentials(
  scope: MedusaContainer,
  params: {
    previousEmail?: string | null
    nextEmail?: string | null
    password?: string
  }
): Promise<void> {
  const prevEmail = params.previousEmail?.trim()
  const nextEmail = params.nextEmail?.trim()
  const emailChanged = Boolean(
    nextEmail &&
      prevEmail &&
      nextEmail.toLowerCase() !== prevEmail.toLowerCase()
  )

  if (!emailChanged && !params.password) {
    return
  }

  const authService = scope.resolve<IAuthModuleService>(Modules.AUTH)

  if (emailChanged && prevEmail && nextEmail) {
    if (
      typeof authService.listProviderIdentities === "function" &&
      typeof authService.updateProviderIdentities === "function"
    ) {
      const identities = await authService
        .listProviderIdentities({
          entity_id: prevEmail,
          provider: "emailpass",
        })
        .catch(() => [])
      if (Array.isArray(identities) && identities.length > 0) {
        await authService.updateProviderIdentities(
          identities.map((identity) => ({
            id: identity.id,
            entity_id: nextEmail,
          }))
        )
      }
    }
  }

  if (params.password) {
    const targetEntityId = nextEmail || prevEmail
    if (targetEntityId) {
      await authService.updateProvider("emailpass", {
        entity_id: targetEntityId,
        password: params.password,
      })
    }
  }
}
