import { generateResetPasswordTokenWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { ResetPasswordRequestType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<ResetPasswordRequestType>,
  res: MedusaResponse
) => {
  const { auth_provider, actor_type } = req.params

  if (actor_type === "customer" && auth_provider === "emailpass") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Customer email/password reset-password is disabled. Please use phone OTP authentication."
    )
  }

  const { identifier, metadata } = req.validatedBody

  const { http } = req.scope.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig

  await generateResetPasswordTokenWorkflow(req.scope).run({
    input: {
      entityId: identifier,
      actorType: actor_type,
      provider: auth_provider,
      secret: http.jwtSecret!,
      jwtOptions: http.jwtOptions,
      metadata,
    },
    throwOnError: false, // we don't want to throw on error to avoid leaking information about non-existing identities
  })

  res.sendStatus(201)
}
