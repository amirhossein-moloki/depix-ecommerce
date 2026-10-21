import { MedusaError, Modules } from "@medusajs/framework/utils"

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
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreSettingsDTO {
  id: string
  storeName: string
  contactPhone: string
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

export class StoreSettingsService {
  private storeService: any

  constructor(container: any) {
    this.storeService = container.resolve(Modules.STORE)
  }

  /**
   * Formats internal StoreAddress entity into DTO with camelCase & snake_case properties.
   */
  public formatAddress(addr: any): StoreAddressDTO {
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
        contact_phone: "",
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

  /**
   * Retrieves full store settings including list of addresses and defaults.
   */
  public async getSettings(): Promise<StoreSettingsDTO> {
    const settingsRecord = await this.getOrCreateSettingsRecord()
    const addressesRaw = await this.storeService.listStoreAddresses({}, { order: { created_at: "ASC" } })
    const formattedAddresses = (addressesRaw || []).map((a: any) => this.formatAddress(a))

    let defaultShippingId = settingsRecord.default_shipping_address_id || settingsRecord.defaultShippingAddressId || null
    let defaultReturnId = settingsRecord.default_return_address_id || settingsRecord.defaultReturnAddressId || null

    // Fallback if configured default ID points to non-existent address
    const validAddressIds = new Set(formattedAddresses.map((a: StoreAddressDTO) => a.id))
    if (defaultShippingId && !validAddressIds.has(defaultShippingId)) {
      defaultShippingId = formattedAddresses.length > 0 ? formattedAddresses[0].id : null
    }
    if (defaultReturnId && !validAddressIds.has(defaultReturnId)) {
      defaultReturnId = formattedAddresses.length > 0 ? formattedAddresses[0].id : null
    }

    return {
      id: settingsRecord.id,
      storeName: settingsRecord.store_name ?? settingsRecord.storeName ?? "Mepusham",
      contactPhone: settingsRecord.contact_phone ?? settingsRecord.contactPhone ?? "",
      supportEmail: settingsRecord.support_email ?? settingsRecord.supportEmail ?? "",
      address: settingsRecord.address ?? "",
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

    // Store Name validation
    const storeName = data.storeName ?? data.store_name
    if (storeName !== undefined) {
      if (typeof storeName !== "string" || !storeName.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Store name must not be empty or whitespace-only."
        )
      }
      if (storeName.trim().length > 255) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Store name must not exceed 255 characters."
        )
      }
      updates.store_name = storeName.trim()
    }

    // Contact / Support Phone validation
    const contactPhone = data.contactPhone ?? data.contact_phone ?? data.supportPhone ?? data.support_phone
    if (contactPhone !== undefined) {
      if (contactPhone !== "" && contactPhone !== null) {
        const cleanedPhone = validateAndCleanPhone(contactPhone, "Contact phone")
        updates.contact_phone = cleanedPhone
      } else {
        updates.contact_phone = ""
      }
    }

    // Support Email validation
    const supportEmail = data.supportEmail ?? data.support_email
    if (supportEmail !== undefined) {
      if (supportEmail && (typeof supportEmail !== "string" || !validateEmail(supportEmail))) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Support email format is invalid."
        )
      }
      updates.support_email = supportEmail ? supportEmail.trim() : ""
    }

    // Address
    if (data.address !== undefined) {
      updates.address = data.address ? String(data.address).trim() : ""
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
      },
    ])

    // If this is the first address and no defaults exist, assign as both shipping & return defaults automatically
    const settingsRecord = await this.getOrCreateSettingsRecord()
    const currentShippingDefault = settingsRecord.default_shipping_address_id
    const currentReturnDefault = settingsRecord.default_return_address_id

    if (isFirstAddress || (!currentShippingDefault && !currentReturnDefault)) {
      await this.storeService.updateStoreSettings(settingsRecord.id, {
        default_shipping_address_id: currentShippingDefault || created.id,
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

    updates.updated_at = new Date()

    await this.storeService.updateStoreAddresses(id, updates)
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
