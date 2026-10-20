import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { normalizePhoneNumber } from "../../../../modules/providers/notification-sms/src/utils/phone-normalizer"
import { SmsNotificationService } from "../../../../modules/providers/notification-sms/src/services/sms"
import { SendOtpRequestType } from "../validators"

// In-memory fallback OTP storage if cache module service is not configured
export const memoryOtpStore = new Map<string, { code: string; expiresAt: number }>()

export const POST = async (
  req: MedusaRequest<SendOtpRequestType>,
  res: MedusaResponse
) => {
  const { phone } = req.validatedBody || (req.body as any)

  if (!phone) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Phone number is required"
    )
  }

  const normalizedPhone = normalizePhoneNumber(phone)
  if (!normalizedPhone) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid phone number format: ${phone}`
    )
  }

  // Generate 5-digit OTP code
  const code = Math.floor(10000 + Math.random() * 90000).toString()
  const ttlSeconds = 300 // 5 minutes
  const cacheKey = `otp:phone:${normalizedPhone}`

  // Try saving to Medusa Cache module service, fallback to memoryOtpStore
  try {
    const cacheService = req.scope.resolve<any>(Modules.CACHE)
    if (cacheService && typeof cacheService.set === "function") {
      await cacheService.set(cacheKey, { code }, ttlSeconds)
    } else {
      memoryOtpStore.set(cacheKey, {
        code,
        expiresAt: Date.now() + ttlSeconds * 1000,
      })
    }
  } catch {
    memoryOtpStore.set(cacheKey, {
      code,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  // Send OTP via SMS Notification Service
  let logger: any
  try {
    logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  } catch {
    logger = console
  }

  const smsService = new SmsNotificationService({ logger })
  await smsService.send({
    to: normalizedPhone,
    content: {
      text: `کد تایید ورود به سایت: ${code}`,
    },
  })

  res.status(200).json({
    success: true,
    phone: normalizedPhone,
    message: "OTP code sent successfully via SMS",
  })
}
