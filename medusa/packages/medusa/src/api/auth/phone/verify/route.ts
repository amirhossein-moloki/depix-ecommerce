import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ConfigModule,
  IAuthModuleService,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createCustomerAccountWorkflow } from "@medusajs/core-flows"
import { normalizePhoneNumber } from "../../../../modules/providers/notification-sms/src/utils/phone-normalizer"
import { generateJwtTokenForAuthIdentity } from "../../utils/generate-jwt-token"
import { memoryOtpStore } from "../send-otp/route"
import { VerifyOtpRequestType } from "../validators"

export const POST = async (
  req: MedusaRequest<VerifyOtpRequestType>,
  res: MedusaResponse
) => {
  const { phone, code } = req.validatedBody || (req.body as any)

  if (!phone || !code) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Both phone number and OTP code are required"
    )
  }

  const normalizedPhone = normalizePhoneNumber(phone)
  if (!normalizedPhone) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid phone number format: ${phone}`
    )
  }

  const cacheKey = `otp:phone:${normalizedPhone}`
  let storedCode: string | undefined

  // Retrieve code from Cache service or memory store fallback
  try {
    const cacheService = req.scope.resolve<any>(Modules.CACHE)
    if (cacheService && typeof cacheService.get === "function") {
      const cached = await cacheService.get(cacheKey)
      if (cached && typeof cached === "object") {
        storedCode = cached.code
      } else if (typeof cached === "string") {
        storedCode = cached
      }
    }
  } catch {
    // ignore and check memoryOtpStore
  }

  if (!storedCode) {
    const memoryData = memoryOtpStore.get(cacheKey)
    if (memoryData && memoryData.expiresAt > Date.now()) {
      storedCode = memoryData.code
    }
  }

  if (!storedCode || storedCode !== code.toString().trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid or expired OTP code"
    )
  }

  // Clear OTP code from cache / store after verification
  try {
    const cacheService = req.scope.resolve<any>(Modules.CACHE)
    if (cacheService && typeof cacheService.invalidate === "function") {
      await cacheService.invalidate(cacheKey)
    }
  } catch {
    // ignore
  }
  memoryOtpStore.delete(cacheKey)

  // Search for existing Customer by phone
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const localPhone = normalizePhoneNumber(phone, { format: "local" })

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "phone", "first_name", "last_name", "has_account", "metadata"],
    filters: {
      phone: [normalizedPhone, localPhone, phone],
    },
  })

  let customer = customers?.[0]
  const authModule: IAuthModuleService = req.scope.resolve(Modules.AUTH)

  // Find or create AuthIdentity associated with this phone number
  let authIdentity: any
  try {
    const authIdentities = await authModule.listAuthIdentities({
      provider_identities: {
        entity_id: normalizedPhone,
      },
    })
    authIdentity = authIdentities?.[0]
  } catch {
    // list error
  }

  if (!customer) {
    // Account does not exist: Create Auth Identity & Customer Account
    if (!authIdentity) {
      authIdentity = await authModule.createAuthIdentities({
        provider_identities: [
          {
            provider: "phone",
            entity_id: normalizedPhone,
          },
        ],
      })
    }

    const createCustomers = createCustomerAccountWorkflow(req.scope)
    const { result: newCustomer } = await createCustomers.run({
      input: {
        authIdentityId: authIdentity.id,
        customerData: {
          phone: normalizedPhone,
        },
      },
    })

    customer = newCustomer
  } else {
    // Customer exists: Ensure Auth Identity exists and customer_id is set in app_metadata
    if (!authIdentity) {
      authIdentity = await authModule.createAuthIdentities({
        app_metadata: {
          customer_id: customer.id,
        },
        provider_identities: [
          {
            provider: "phone",
            entity_id: normalizedPhone,
          },
        ],
      })
    } else if (authIdentity.app_metadata?.customer_id !== customer.id) {
      authIdentity = await authModule.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: {
          ...(authIdentity.app_metadata || {}),
          customer_id: customer.id,
        },
      })
    }
  }

  // Generate JWT Bearer Token
  const { http } = req.scope.resolve<ConfigModule>(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig

  const token = await generateJwtTokenForAuthIdentity(
    {
      authIdentity,
      actorType: "customer",
      authProvider: "phone",
      container: req.scope,
    },
    {
      secret: http.jwtSecret!,
      expiresIn: http.jwtExpiresIn,
      options: http.jwtOptions,
    }
  )

  res.status(200).json({
    token,
    customer,
  })
}
