import { ConfigurationError } from "@amirhossein-moloki/payment-core"
import { validateZibalConfig } from "@amirhossein-moloki/payment-zibal"

export type PaymentPlatformEnv = "sandbox" | "production"

export interface ZibalRuntimeConfig {
  environment: PaymentPlatformEnv
  appUrl: string
  successUrl: string
  failedUrl: string
  merchant: string
  callbackUrl: string
  timeoutMs: number
}

const DEFAULT_TIMEOUT_MS = 15000

/**
 * Normalizes PAYMENT_ENV into the Zibal/payment-core environment union.
 */
export function parsePaymentEnv(rawEnv?: string): PaymentPlatformEnv {
  const normalized = String(rawEnv ?? "")
    .trim()
    .toLowerCase()

  if (
    normalized === "" ||
    normalized === "sandbox" ||
    normalized === "development" ||
    normalized === "dev" ||
    normalized === "test"
  ) {
    return "sandbox"
  }

  if (normalized === "production" || normalized === "prod") {
    return "production"
  }

  throw new ConfigurationError(
    `Invalid PAYMENT_ENV '${normalized}'; expected 'sandbox', 'development', or 'production'`
  )
}

/**
 * Validates APP_URL and strips any trailing slashes.
 * Requires HTTPS in production while allowing http://localhost in local/sandbox environments.
 */
export function validateAppUrl(
  rawUrl: string | undefined,
  env: PaymentPlatformEnv
): string {
  const trimmed = String(rawUrl ?? "").trim()
  if (!trimmed) {
    throw new ConfigurationError("APP_URL environment variable is required")
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new ConfigurationError("APP_URL must be a valid absolute URL")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigurationError("APP_URL must use http or https protocol")
  }

  if (env === "production" && parsed.protocol !== "https:") {
    throw new ConfigurationError("APP_URL must use https protocol in production")
  }

  return trimmed.replace(/\/+$/, "")
}

/**
 * Builds the base frontend payment redirect routes from APP_URL.
 */
export function buildPaymentRedirectUrls(
  rawAppUrl: string | undefined,
  env: PaymentPlatformEnv
): {
  appUrl: string
  successUrl: string
  failedUrl: string
} {
  const appUrl = validateAppUrl(rawAppUrl, env)
  return {
    appUrl,
    successUrl: `${appUrl}/payment/success`,
    failedUrl: `${appUrl}/payment/failed`,
  }
}

function appendSafeQueryParams(
  baseUrl: string,
  params?: Record<string, string | number | undefined | null>
): string {
  if (!params) {
    return baseUrl
  }

  const url = new URL(baseUrl)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      const str = String(value).trim()
      if (str.length > 0) {
        url.searchParams.set(key, str)
      }
    }
  }
  return url.toString()
}

export function buildSuccessRedirectUrl(
  rawAppUrl: string | undefined,
  env: PaymentPlatformEnv,
  params?: {
    payment_id?: string
    order_id?: string
    track_id?: string
    ref_id?: string
  }
): string {
  const { successUrl } = buildPaymentRedirectUrls(rawAppUrl, env)
  return appendSafeQueryParams(successUrl, params)
}

export function buildFailedRedirectUrl(
  rawAppUrl: string | undefined,
  env: PaymentPlatformEnv,
  params?: {
    payment_id?: string
    track_id?: string
    reason?: string
  }
): string {
  const { failedUrl } = buildPaymentRedirectUrls(rawAppUrl, env)
  return appendSafeQueryParams(failedUrl, params)
}

/**
 * Reads and validates all Zibal and redirect domain configuration from environment variables.
 * Never includes sensitive merchant credentials in thrown error messages.
 */
export function loadZibalRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env
): ZibalRuntimeConfig {
  const environment = parsePaymentEnv(env.PAYMENT_ENV)
  const { appUrl, successUrl, failedUrl } = buildPaymentRedirectUrls(
    env.APP_URL,
    environment
  )

  const merchant = String(env.ZIBAL_MERCHANT ?? "").trim()
  const callbackUrl = String(env.ZIBAL_CALLBACK_URL ?? "").trim()

  const rawTimeout = env.PAYMENT_TIMEOUT_MS
    ? Number(env.PAYMENT_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS
  if (!Number.isFinite(rawTimeout) || rawTimeout <= 0) {
    throw new ConfigurationError(
      "PAYMENT_TIMEOUT_MS must be a positive number when set"
    )
  }

  validateZibalConfig({
    gatewayId: "zibal",
    merchant,
    callbackUrl,
    environment,
    timeoutMs: rawTimeout,
  })

  return {
    environment,
    appUrl,
    successUrl,
    failedUrl,
    merchant,
    callbackUrl,
    timeoutMs: rawTimeout,
  }
}

/**
 * Startup validation hook: enforces complete Zibal + APP_URL configuration when Zibal
 * is configured or when running in production mode.
 */
export function validatePaymentPlatformStartupConfig(
  env: NodeJS.ProcessEnv = process.env
): ZibalRuntimeConfig | null {
  const paymentEnv = parsePaymentEnv(env.PAYMENT_ENV)
  const hasAnyZibalSetting = Boolean(
    env.ZIBAL_MERCHANT || env.ZIBAL_CALLBACK_URL || env.APP_URL
  )

  if (paymentEnv === "production" || hasAnyZibalSetting) {
    return loadZibalRuntimeConfig(env)
  }

  return null
}
