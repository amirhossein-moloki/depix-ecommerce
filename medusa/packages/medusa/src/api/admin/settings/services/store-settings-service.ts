import { MedusaError, Modules } from "@medusajs/framework/utils"

export const ALLOWED_SOCIAL_PLATFORMS = [
  "instagram",
  "whatsapp",
  "telegram",
  "aparat",
  "linkedin",
  "youtube",
] as const

export type SocialPlatform = (typeof ALLOWED_SOCIAL_PLATFORMS)[number]

export interface StoreContactPhoneDTO {
  label: string
  number: string
}

export interface StoreSocialLinkDTO {
  platform: SocialPlatform
  url: string
}

export interface PublicStoreSettingsDTO {
  storeName: string
  logoUrl: string | null
  brandDescription: string
  address: string
  contactPhones: StoreContactPhoneDTO[]
  socialLinks: StoreSocialLinkDTO[]
  updatedAt: string
}

export interface StoreAddressDTO {
  id: string
  title: string
  recipientName: string
  recipient_name?: string
  phone: string
  province: string
  city: string
  address: string
  plaque: string | null
  floor: string | null
  postalCode: string
  postal_code?: string
  postexCityCode?: number | null
  postex_city_code?: number | null
  isDefaultShipping?: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreSettingsDTO {
  id: string
  storeName: string
  logoId: string | null
  logoUrl: string | null
  brandDescription: string
  contactPhone: string
  contactPhones: StoreContactPhoneDTO[]
  socialLinks: StoreSocialLinkDTO[]
  supportEmail: string
  address: string
  taxRate: number
  enableSmsNotifications: boolean
  enableEmailNotifications: boolean
  returnWindowDays: number
  autoApproveReturns: boolean
  defaultShippingAddressId: string | null
  defaultReturnAddressId: string | null
  addresses: StoreAddressDTO[]
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Normalizes Persian and Arabic numerals to ASCII standard digits (0-9).
 */
export function normalizeDigits(input: string): string {
  if (!input) return ""
  return input
    .replace(/[۰٠]/g, "0")
    .replace(/[۱١]/g, "1")
    .replace(/[۲٢]/g, "2")
    .replace(/[۳٣]/g, "3")
    .replace(/[۴٤]/g, "4")
    .replace(/[۵٥]/g, "5")
    .replace(/[۶٦]/g, "6")
    .replace(/[۷٧]/g, "7")
    .replace(/[۸٨]/g, "8")
    .replace(/[۹٩]/g, "9")
}

/**
 * Validates and cleans a Persian/international phone number.
 */
export function validateAndCleanPhone(phoneInput: string, fieldName: string = "Phone"): string {
  if (!phoneInput || typeof phoneInput !== "string" || !phoneInput.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} is required.`
    )
  }
  const normalized = normalizeDigits(phoneInput.trim())
  const digitsOnly = normalized.replace(/\D/g, "")
  if (digitsOnly.length < 8 || digitsOnly.length > 12) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must contain between 8 and 12 digits.`
    )
  }
  return normalized.replace(/[^\d+]/g, "")
}

/**
 * Validates an Iranian 10-digit postal code.
 */
export function validateAndCleanPostalCode(postalCodeInput: string): string {
  if (!postalCodeInput || typeof postalCodeInput !== "string" || !postalCodeInput.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal code is required."
    )
  }
  const normalized = normalizeDigits(postalCodeInput.trim())
  const digitsOnly = normalized.replace(/\D/g, "")
  if (digitsOnly.length !== 10) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Postal code must be exactly 10 digits."
    )
  }
  return digitsOnly
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): boolean {
  if (!email) return true // optional email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates an admin-configured store logo URL or local upload path.
 */
export function validateLogoUrl(input: unknown): string | null {
  if (input === null) {
    return null
  }
  if (typeof input !== "string") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "logoUrl must be a string or null.")
  }
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > 2048) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "logoUrl must not exceed 2048 characters.")
  }
  if (/^\/(uploads|static)\/\S+$/.test(trimmed)) {
    return trimmed
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "logoUrl must be a valid HTTP(S) URL or local upload path.")
  }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "logoUrl must use http or https protocol with a valid hostname.")
  }
  return trimmed
}

/**
 * Validates and normalizes a storefront contact phone number while preserving formatting such as hyphens.
 */
export function validateContactPhoneNumber(input: unknown, fieldName: string = "Phone number"): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${fieldName} is required.`)
  }
  const normalized = normalizeDigits(input.trim()).replace(/\s+/g, " ")
  if (!/^[+]?[\d\s-]+$/.test(normalized)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} contains invalid characters.`
    )
  }
  const digitsCount = normalized.replace(/\D/g, "").length
  if (digitsCount < 8 || digitsCount > 15) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must contain between 8 and 15 digits.`
    )
  }
  return normalized
}

/**
 * Validates the structured storefront contactPhones array (1..5 labeled items).
 */
export function validateContactPhones(input: unknown): StoreContactPhoneDTO[] {
  if (!Array.isArray(input)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "contactPhones must be an array.")
  }
  if (input.length < 1 || input.length > 5) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "contactPhones must contain between 1 and 5 items."
    )
  }

  return input.map((item, idx) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `contactPhones[${idx}] must be an object with label and number.`
      )
    }
    const rawLabel = (item as Record<string, unknown>).label
    if (typeof rawLabel !== "string" || !rawLabel.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `contactPhones[${idx}].label is required.`
      )
    }
    const label = rawLabel.trim()
    if (label.length > 40) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `contactPhones[${idx}].label must not exceed 40 characters.`
      )
    }
    const number = validateContactPhoneNumber(
      (item as Record<string, unknown>).number,
      `contactPhones[${idx}].number`
    )
    return { label, number }
  })
}

/**
 * Validates structured storefront socialLinks (0..6 unique allowed platforms with HTTP(S) URLs).
 */
export function validateSocialLinks(input: unknown): StoreSocialLinkDTO[] {
  if (input === null) {
    return []
  }
  if (!Array.isArray(input)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "socialLinks must be an array.")
  }
  if (input.length > 6) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "socialLinks must not contain more than 6 items."
    )
  }

  const seenPlatforms = new Set<string>()
  const allowedSet = new Set<string>(ALLOWED_SOCIAL_PLATFORMS)

  return input.map((item, idx) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}] must be an object with platform and url.`
      )
    }
    const rawPlatform = (item as Record<string, unknown>).platform
    if (typeof rawPlatform !== "string" || !rawPlatform.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}].platform is required.`
      )
    }
    const platform = rawPlatform.trim().toLowerCase()
    if (!allowedSet.has(platform)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}].platform must be one of: ${ALLOWED_SOCIAL_PLATFORMS.join(", ")}.`
      )
    }
    if (seenPlatforms.has(platform)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Duplicate socialLinks platform '${platform}' is not allowed.`
      )
    }
    seenPlatforms.add(platform)

    const rawUrl = (item as Record<string, unknown>).url
    if (typeof rawUrl !== "string" || !rawUrl.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}].url is required.`
      )
    }
    const url = rawUrl.trim()
    if (url.length > 2048) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}].url must not exceed 2048 characters.`
      )
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}].url must be a valid HTTP(S) URL.`
      )
    }
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `socialLinks[${idx}].url must use http or https protocol with a valid hostname.`
      )
    }

    return { platform: platform as SocialPlatform, url }
  })
}

function pickDefined(
  data: Record<string, any>,
  ...keys: string[]
): { present: boolean; value: any } {
  for (const key of keys) {
    if (key in data && data[key] !== undefined) {
      return { present: true, value: data[key] }
    }
  }
  return { present: false, value: undefined }
}

function normalizeOptionalBoundedString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string {
  if (value === null || value === "") {
    return ""
  }
  if (typeof value !== "string") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${fieldName} must be a string.`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must not exceed ${maxLength} characters.`
    )
  }
  return trimmed
}

export class StoreSettingsService {
  private storeService: any

  constructor(container: any) {
    this.storeService = container.resolve(Modules.STORE)
  }

  /**
   * Formats internal StoreAddress entity into DTO with camelCase & snake_case properties.
   */
  public formatAddress(addr: any, defaultShippingAddressId?: string | null): StoreAddressDTO {
    const rawPostexCityCode =
      addr.postex_city_code ??
      addr.postexCityCode ??
      addr.metadata?.postexCityCode ??
      addr.metadata?.postex_city_code
    const postexCityCode =
      rawPostexCityCode !== undefined && rawPostexCityCode !== null
        ? Number(rawPostexCityCode)
        : null

    return {
      id: addr.id,
      title: addr.title,
      recipientName: addr.recipient_name || addr.recipientName || "",
      recipient_name: addr.recipient_name || addr.recipientName || "",
      phone: addr.phone || "",
      province: addr.province || "",
      city: addr.city || "",
      address: addr.address || "",
      plaque: addr.plaque || null,
      floor: addr.floor || null,
      postalCode: addr.postal_code || addr.postalCode || "",
      postal_code: addr.postal_code || addr.postalCode || "",
      ...(postexCityCode !== null && Number.isFinite(postexCityCode)
        ? { postexCityCode, postex_city_code: postexCityCode }
        : {}),
      ...(defaultShippingAddressId !== undefined
        ? { isDefaultShipping: addr.id === defaultShippingAddressId }
        : {}),
      createdAt: addr.created_at || addr.createdAt || new Date(),
      updatedAt: addr.updated_at || addr.updatedAt || new Date(),
    }
  }

  /**
   * Helper to retrieve or lazily create the singleton StoreSetting record.
   */
  public async getOrCreateSettingsRecord(): Promise<any> {
    const settingsList = await this.storeService.listStoreSettings({}, { take: 1 })
    if (settingsList && settingsList.length > 0) {
      return settingsList[0]
    }

    // Lazily seed default settings if missing
    const [created] = await this.storeService.createStoreSettings([
      {
        store_name: "Mepusham",
        logo_id: null,
        logo_url: null,
        brand_description: "",
        contact_phone: "",
        contact_phones: [],
        social_links: [],
        support_email: "",
        address: "",
        tax_rate: 0,
        enable_sms_notifications: true,
        enable_email_notifications: true,
        return_window_days: 2,
        auto_approve_returns: false,
        default_shipping_address_id: null,
        default_return_address_id: null,
      },
    ])
    return created
  }

  private buildPublicSettings(settingsRecord: any): PublicStoreSettingsDTO {
    const rawPhones = settingsRecord.contact_phones ?? settingsRecord.contactPhones
    let contactPhones: StoreContactPhoneDTO[] = []
    if (Array.isArray(rawPhones) && rawPhones.length > 0) {
      contactPhones = rawPhones
        .filter(
          (p: any) =>
            p &&
            typeof p === "object" &&
            typeof p.label === "string" &&
            p.label.trim() &&
            typeof p.number === "string" &&
            p.number.trim()
        )
        .map((p: any) => ({
          label: p.label.trim(),
          number: p.number.trim(),
        }))
    }
    if (contactPhones.length === 0) {
      const legacyPhone = String(
        settingsRecord.contact_phone ?? settingsRecord.contactPhone ?? ""
      ).trim()
      if (legacyPhone) {
        contactPhones = [{ label: "پشتیبانی", number: legacyPhone }]
      }
    }

    const allowedSet = new Set<string>(ALLOWED_SOCIAL_PLATFORMS)
    const rawLinks = settingsRecord.social_links ?? settingsRecord.socialLinks
    const socialLinks: StoreSocialLinkDTO[] = Array.isArray(rawLinks)
      ? rawLinks
          .filter(
            (l: any) =>
              l &&
              typeof l === "object" &&
              typeof l.platform === "string" &&
              allowedSet.has(l.platform.trim().toLowerCase()) &&
              typeof l.url === "string" &&
              l.url.trim()
          )
          .map((l: any) => ({
            platform: l.platform.trim().toLowerCase() as SocialPlatform,
            url: l.url.trim(),
          }))
      : []

    const rawUpdatedAt = settingsRecord.updated_at || settingsRecord.updatedAt || new Date()
    const updatedAt =
      rawUpdatedAt instanceof Date
        ? rawUpdatedAt.toISOString()
        : new Date(rawUpdatedAt).toISOString()

    return {
      storeName: settingsRecord.store_name ?? settingsRecord.storeName ?? "Mepusham",
      logoUrl: settingsRecord.logo_url ?? settingsRecord.logoUrl ?? null,
      brandDescription: settingsRecord.brand_description ?? settingsRecord.brandDescription ?? "",
      address: settingsRecord.address ?? "",
      contactPhones,
      socialLinks,
      updatedAt,
    }
  }

  /**
   * Retrieves sanitized public storefront identity settings without internal operational fields.
   */
  public async getPublicSettings(): Promise<PublicStoreSettingsDTO> {
    const settingsRecord = await this.getOrCreateSettingsRecord()
    return this.buildPublicSettings(settingsRecord)
  }

  /**
   * Retrieves full store settings including list of addresses and defaults.
   */
  public async getSettings(): Promise<StoreSettingsDTO> {
    const settingsRecord = await this.getOrCreateSettingsRecord()
    const addressesRaw = await this.storeService.listStoreAddresses({}, { order: { created_at: "ASC" } })

    let defaultShippingId = settingsRecord.default_shipping_address_id || settingsRecord.defaultShippingAddressId || null
    let defaultReturnId = settingsRecord.default_return_address_id || settingsRecord.defaultReturnAddressId || null

    // Fallback if configured default ID points to non-existent address
    const rawAddressIds = new Set((addressesRaw || []).map((a: any) => a.id))
    if (defaultShippingId && !rawAddressIds.has(defaultShippingId)) {
      defaultShippingId = addressesRaw?.length > 0 ? addressesRaw[0].id : null
    }
    if (defaultReturnId && !rawAddressIds.has(defaultReturnId)) {
      defaultReturnId = addressesRaw?.length > 0 ? addressesRaw[0].id : null
    }

    const formattedAddresses = (addressesRaw || []).map((a: any) =>
      this.formatAddress(a, defaultShippingId)
    )
    const publicFields = this.buildPublicSettings(settingsRecord)

    return {
      id: settingsRecord.id,
      storeName: publicFields.storeName,
      logoId: settingsRecord.logo_id ?? settingsRecord.logoId ?? null,
      logoUrl: publicFields.logoUrl,
      brandDescription: publicFields.brandDescription,
      contactPhone:
        (settingsRecord.contact_phone ?? settingsRecord.contactPhone) ||
        publicFields.contactPhones[0]?.number ||
        "",
      contactPhones: publicFields.contactPhones,
      socialLinks: publicFields.socialLinks,
      supportEmail: settingsRecord.support_email ?? settingsRecord.supportEmail ?? "",
      address: publicFields.address,
      taxRate: Number(settingsRecord.tax_rate ?? settingsRecord.taxRate ?? 0),
      enableSmsNotifications: Boolean(settingsRecord.enable_sms_notifications ?? settingsRecord.enableSmsNotifications ?? true),
      enableEmailNotifications: Boolean(settingsRecord.enable_email_notifications ?? settingsRecord.enableEmailNotifications ?? true),
      returnWindowDays: Number(settingsRecord.return_window_days ?? settingsRecord.returnWindowDays ?? 2),
      autoApproveReturns: Boolean(settingsRecord.auto_approve_returns ?? settingsRecord.autoApproveReturns ?? false),
      defaultShippingAddressId: defaultShippingId,
      defaultReturnAddressId: defaultReturnId,
      addresses: formattedAddresses,
      createdAt: settingsRecord.created_at || settingsRecord.createdAt || new Date(),
      updatedAt: settingsRecord.updated_at || settingsRecord.updatedAt || new Date(),
    }
  }

  /**
   * Updates explicitly provided store settings fields.
   */
  public async updateSettings(data: Record<string, any>): Promise<StoreSettingsDTO> {
    const settingsRecord = await this.getOrCreateSettingsRecord()

    // Disallow server-managed field changes
    const forbiddenFields = ["id", "created_at", "createdAt", "updated_at", "updatedAt"]
    for (const forbidden of forbiddenFields) {
      if (forbidden in data) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Field '${forbidden}' is server-managed and cannot be updated.`
        )
      }
    }

    const updates: Record<string, any> = {}

    // Store Name validation (2..60 chars)
    const storeNameField = pickDefined(data, "storeName", "store_name")
    if (storeNameField.present) {
      const storeName = storeNameField.value
      if (typeof storeName !== "string" || !storeName.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Store name must not be empty or whitespace-only."
        )
      }
      const trimmedName = storeName.trim()
      if (trimmedName.length < 2 || trimmedName.length > 60) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Store name must be between 2 and 60 characters."
        )
      }
      updates.store_name = trimmedName
    }

    // Brand Description validation (max 300 chars)
    const brandDescriptionField = pickDefined(data, "brandDescription", "brand_description")
    if (brandDescriptionField.present) {
      updates.brand_description = normalizeOptionalBoundedString(
        brandDescriptionField.value,
        "brandDescription",
        300
      )
    }

    // Logo ID & URL validation
    const logoIdField = pickDefined(data, "logoId", "logo_id")
    if (logoIdField.present) {
      const logoId = logoIdField.value
      if (logoId === null || logoId === "") {
        updates.logo_id = null
      } else {
        if (typeof logoId !== "string" || !logoId.trim() || logoId.trim().length > 128) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "logoId must be a non-empty string up to 128 characters, or null."
          )
        }
        updates.logo_id = logoId.trim()
      }
    }

    const logoUrlField = pickDefined(data, "logoUrl", "logo_url")
    if (logoUrlField.present) {
      updates.logo_url = validateLogoUrl(logoUrlField.value)
      if (updates.logo_url === null && !logoIdField.present) {
        updates.logo_id = null
      }
    }

    // Contact Phones array (1..5) and legacy single contactPhone sync
    const contactPhonesField = pickDefined(data, "contactPhones", "contact_phones")
    const legacyContactPhoneField = pickDefined(
      data,
      "contactPhone",
      "contact_phone",
      "supportPhone",
      "support_phone"
    )

    if (contactPhonesField.present) {
      const validatedPhones = validateContactPhones(contactPhonesField.value)
      updates.contact_phones = validatedPhones
      if (!legacyContactPhoneField.present) {
        updates.contact_phone = validatedPhones[0].number.replace(/[^\d+]/g, "")
      }
    }

    // Contact / Support Phone validation
    if (legacyContactPhoneField.present) {
      const contactPhone = legacyContactPhoneField.value
      if (contactPhone !== "" && contactPhone !== null) {
        const cleanedPhone = validateAndCleanPhone(contactPhone, "Contact phone")
        updates.contact_phone = cleanedPhone
      } else {
        updates.contact_phone = ""
      }
      if (!contactPhonesField.present && updates.contact_phone) {
        const existingPhones = settingsRecord.contact_phones ?? settingsRecord.contactPhones
        if (!Array.isArray(existingPhones) || existingPhones.length === 0) {
          updates.contact_phones = [{ label: "پشتیبانی", number: updates.contact_phone }]
        }
      }
    }

    // Social Links validation (0..6)
    const socialLinksField = pickDefined(data, "socialLinks", "social_links")
    if (socialLinksField.present) {
      updates.social_links = validateSocialLinks(socialLinksField.value)
    }

    // Support Email validation
    const supportEmailField = pickDefined(data, "supportEmail", "support_email")
    if (supportEmailField.present) {
      const supportEmail = supportEmailField.value
      if (supportEmail && (typeof supportEmail !== "string" || !validateEmail(supportEmail))) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Support email format is invalid."
        )
      }
      updates.support_email = supportEmail ? supportEmail.trim() : ""
    }

    // Address validation (max 300 chars)
    if ("address" in data && data.address !== undefined) {
      updates.address = normalizeOptionalBoundedString(data.address, "address", 300)
    }

    // Tax Rate validation
    const taxRate = data.taxRate ?? data.tax_rate
    if (taxRate !== undefined) {
      const numTaxRate = Number(taxRate)
      if (isNaN(numTaxRate) || numTaxRate < 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Tax rate must be a non-negative number."
        )
      }
      updates.tax_rate = numTaxRate
    }

    // Notification Toggles
    const enableSms = data.enableSmsNotifications ?? data.enable_sms_notifications
    if (enableSms !== undefined) {
      updates.enable_sms_notifications = Boolean(enableSms)
    }

    const enableEmail = data.enableEmailNotifications ?? data.enable_email_notifications
    if (enableEmail !== undefined) {
      updates.enable_email_notifications = Boolean(enableEmail)
    }

    // Return Window Days validation
    const returnWindowDays = data.returnWindowDays ?? data.return_window_days
    if (returnWindowDays !== undefined) {
      const numDays = Number(returnWindowDays)
      if (isNaN(numDays) || !Number.isInteger(numDays) || numDays <= 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Return window days must be a positive integer."
        )
      }
      updates.return_window_days = numDays
    }

    // Auto Approve Returns
    const autoApprove = data.autoApproveReturns ?? data.auto_approve_returns
    if (autoApprove !== undefined) {
      updates.auto_approve_returns = Boolean(autoApprove)
    }

    // Default Shipping Address ID
    const defaultShippingId = data.defaultShippingAddressId ?? data.default_shipping_address_id
    if (defaultShippingId !== undefined) {
      if (defaultShippingId !== null) {
        const address = await this.storeService.retrieveStoreAddress(defaultShippingId).catch(() => null)
        if (!address) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Address with ID '${defaultShippingId}' does not exist.`
          )
        }
      }
      updates.default_shipping_address_id = defaultShippingId
    }

    // Default Return Address ID
    const defaultReturnId = data.defaultReturnAddressId ?? data.default_return_address_id
    if (defaultReturnId !== undefined) {
      if (defaultReturnId !== null) {
        const address = await this.storeService.retrieveStoreAddress(defaultReturnId).catch(() => null)
        if (!address) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Address with ID '${defaultReturnId}' does not exist.`
          )
        }
      }
      updates.default_return_address_id = defaultReturnId
    }

    updates.updated_at = new Date()

    await this.storeService.updateStoreSettings(settingsRecord.id, updates)
    return this.getSettings()
  }

  /**
   * Creates a new StoreAddress.
   */
  public async createAddress(data: Record<string, any>): Promise<StoreAddressDTO> {
    const title = data.title
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Address title is required.")
    }

    const recipientName = data.recipientName ?? data.recipient_name
    if (!recipientName || typeof recipientName !== "string" || !recipientName.trim()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Recipient name is required.")
    }

    const phone = validateAndCleanPhone(data.phone, "Phone")

    const province = data.province
    if (!province || typeof province !== "string" || !province.trim()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Province is required.")
    }

    const city = data.city
    if (!city || typeof city !== "string" || !city.trim()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "City is required.")
    }

    const addressStr = data.address
    if (!addressStr || typeof addressStr !== "string" || !addressStr.trim()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Full address is required.")
    }

    const postalCode = validateAndCleanPostalCode(data.postalCode ?? data.postal_code)

    const plaque = data.plaque ? String(data.plaque).trim() : null
    const floor = data.floor ? String(data.floor).trim() : null
    const rawPostexCityCode = data.postexCityCode ?? data.postex_city_code
    let postexCityCode: number | null = null
    if (rawPostexCityCode !== undefined && rawPostexCityCode !== null && rawPostexCityCode !== "") {
      const parsed = Number(rawPostexCityCode)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "postexCityCode must be a positive integer.")
      }
      postexCityCode = parsed
    }

    const existingAddresses = await this.storeService.listStoreAddresses({}, { take: 100 })
    const isFirstAddress = !existingAddresses || existingAddresses.length === 0

    const [created] = await this.storeService.createStoreAddresses([
      {
        title: title.trim(),
        recipient_name: recipientName.trim(),
        phone: phone,
        province: province.trim(),
        city: city.trim(),
        address: addressStr.trim(),
        plaque,
        floor,
        postal_code: postalCode,
        ...(postexCityCode !== null
          ? { metadata: { ...(data.metadata ?? {}), postexCityCode } }
          : data.metadata !== undefined
            ? { metadata: data.metadata }
            : {}),
      },
    ])

    // If this is the first address and no defaults exist, or isDefaultShipping is true, assign default
    const settingsRecord = await this.getOrCreateSettingsRecord()
    const currentShippingDefault = settingsRecord.default_shipping_address_id
    const currentReturnDefault = settingsRecord.default_return_address_id

    if (isFirstAddress || (!currentShippingDefault && !currentReturnDefault) || data.isDefaultShipping === true) {
      await this.storeService.updateStoreSettings(settingsRecord.id, {
        default_shipping_address_id:
          data.isDefaultShipping === true ? created.id : currentShippingDefault || created.id,
        default_return_address_id: currentReturnDefault || created.id,
        updated_at: new Date(),
      })
    }

    return this.formatAddress(created)
  }

  /**
   * Updates an existing StoreAddress.
   */
  public async updateAddress(id: string, data: Record<string, any>): Promise<StoreAddressDTO> {
    const existing = await this.storeService.retrieveStoreAddress(id).catch(() => null)
    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Address with ID '${id}' not found.`)
    }

    const forbiddenFields = ["id", "created_at", "createdAt", "updated_at", "updatedAt"]
    for (const forbidden of forbiddenFields) {
      if (forbidden in data) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Field '${forbidden}' cannot be overwritten.`)
      }
    }

    const updates: Record<string, any> = {}

    if (data.title !== undefined) {
      if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Title cannot be empty.")
      }
      updates.title = data.title.trim()
    }

    const recipientName = data.recipientName ?? data.recipient_name
    if (recipientName !== undefined) {
      if (!recipientName || typeof recipientName !== "string" || !recipientName.trim()) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Recipient name cannot be empty.")
      }
      updates.recipient_name = recipientName.trim()
    }

    if (data.phone !== undefined) {
      updates.phone = validateAndCleanPhone(data.phone, "Phone")
    }

    if (data.province !== undefined) {
      if (!data.province || typeof data.province !== "string" || !data.province.trim()) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Province cannot be empty.")
      }
      updates.province = data.province.trim()
    }

    if (data.city !== undefined) {
      if (!data.city || typeof data.city !== "string" || !data.city.trim()) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "City cannot be empty.")
      }
      updates.city = data.city.trim()
    }

    if (data.address !== undefined) {
      if (!data.address || typeof data.address !== "string" || !data.address.trim()) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Address cannot be empty.")
      }
      updates.address = data.address.trim()
    }

    const postalCode = data.postalCode ?? data.postal_code
    if (postalCode !== undefined) {
      updates.postal_code = validateAndCleanPostalCode(postalCode)
    }

    if (data.plaque !== undefined) {
      updates.plaque = data.plaque ? String(data.plaque).trim() : null
    }

    if (data.floor !== undefined) {
      updates.floor = data.floor ? String(data.floor).trim() : null
    }

    const rawPostexCityCode = data.postexCityCode ?? data.postex_city_code
    if (rawPostexCityCode !== undefined) {
      if (rawPostexCityCode === null || rawPostexCityCode === "") {
        updates.metadata = { ...(existing.metadata ?? {}), postexCityCode: null }
      } else {
        const parsed = Number(rawPostexCityCode)
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw new MedusaError(MedusaError.Types.INVALID_DATA, "postexCityCode must be a positive integer.")
        }
        updates.metadata = { ...(existing.metadata ?? {}), postexCityCode: parsed }
      }
    }

    updates.updated_at = new Date()

    await this.storeService.updateStoreAddresses(id, updates)
    if (data.isDefaultShipping === true) {
      await this.setDefaultShippingAddress(id)
    }
    const updated = await this.storeService.retrieveStoreAddress(id)
    return this.formatAddress(updated)
  }

  /**
   * Deletes a StoreAddress and reassigns defaults atomically if needed.
   */
  public async deleteAddress(id: string): Promise<{ deleted: boolean; id: string }> {
    const existing = await this.storeService.retrieveStoreAddress(id).catch(() => null)
    if (!existing) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Address with ID '${id}' not found.`)
    }

    await this.storeService.deleteStoreAddresses(id)

    // Check remaining addresses and reassign default IDs atomically if deleted address was a default
    const remainingAddresses = await this.storeService.listStoreAddresses({}, { order: { created_at: "ASC" } })
    const settingsRecord = await this.getOrCreateSettingsRecord()

    const updates: Record<string, any> = {}
    const newDefaultId = remainingAddresses && remainingAddresses.length > 0 ? remainingAddresses[0].id : null

    if (settingsRecord.default_shipping_address_id === id) {
      updates.default_shipping_address_id = newDefaultId
    }

    if (settingsRecord.default_return_address_id === id) {
      updates.default_return_address_id = newDefaultId
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date()
      await this.storeService.updateStoreSettings(settingsRecord.id, updates)
    }

    return { deleted: true, id }
  }

  /**
   * Updates default shipping address ID.
   */
  public async setDefaultShippingAddress(addressId: string): Promise<StoreSettingsDTO> {
    if (!addressId || typeof addressId !== "string") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Address ID is required.")
    }

    const address = await this.storeService.retrieveStoreAddress(addressId).catch(() => null)
    if (!address) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Address with ID '${addressId}' does not exist.`)
    }

    const settingsRecord = await this.getOrCreateSettingsRecord()
    await this.storeService.updateStoreSettings(settingsRecord.id, {
      default_shipping_address_id: addressId,
      updated_at: new Date(),
    })

    return this.getSettings()
  }

  /**
   * Updates default return address ID.
   */
  public async setDefaultReturnAddress(addressId: string): Promise<StoreSettingsDTO> {
    if (!addressId || typeof addressId !== "string") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Address ID is required.")
    }

    const address = await this.storeService.retrieveStoreAddress(addressId).catch(() => null)
    if (!address) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Address with ID '${addressId}' does not exist.`)
    }

    const settingsRecord = await this.getOrCreateSettingsRecord()
    await this.storeService.updateStoreSettings(settingsRecord.id, {
      default_return_address_id: addressId,
      updated_at: new Date(),
    })

    return this.getSettings()
  }

  /**
   * Resolves the default shipping address snapshot for order creation.
   */
  public async getShippingAddressSnapshot(): Promise<Record<string, any> | null> {
    const settings = await this.getSettings()
    if (!settings.defaultShippingAddressId) return null
    const addr = settings.addresses.find((a) => a.id === settings.defaultShippingAddressId)
    if (!addr) return null
    return {
      title: addr.title,
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      address: addr.address,
      plaque: addr.plaque,
      floor: addr.floor,
      postalCode: addr.postalCode,
      ...(addr.postexCityCode !== undefined && addr.postexCityCode !== null
        ? { postexCityCode: addr.postexCityCode }
        : {}),
    }
  }

  /**
   * Resolves the default return address snapshot for return/exchange request creation.
   */
  public async getReturnAddressSnapshot(): Promise<Record<string, any> | null> {
    const settings = await this.getSettings()
    if (!settings.defaultReturnAddressId) return null
    const addr = settings.addresses.find((a) => a.id === settings.defaultReturnAddressId)
    if (!addr) return null
    return {
      title: addr.title,
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      address: addr.address,
      plaque: addr.plaque,
      floor: addr.floor,
      postalCode: addr.postalCode,
      ...(addr.postexCityCode !== undefined && addr.postexCityCode !== null
        ? { postexCityCode: addr.postexCityCode }
        : {}),
    }
  }

  /**
   * Calculates return eligibility based on actual delivery timestamp and returnWindowDays setting.
   */
  public isReturnEligible(deliveryTimestamp: Date | string | number, returnWindowDays: number): boolean {
    if (!deliveryTimestamp) return false
    const deliveryTime = new Date(deliveryTimestamp).getTime()
    if (isNaN(deliveryTime)) return false
    const windowMs = returnWindowDays * 24 * 60 * 60 * 1000
    const now = Date.now()
    return now <= deliveryTime + windowMs
  }
}
