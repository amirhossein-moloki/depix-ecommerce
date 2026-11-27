import {
  normalizeDigits,
  validateAndCleanPhone,
  validateAndCleanPostalCode,
  validateEmail,
  validateLogoUrl,
  validateContactPhoneNumber,
  validateContactPhones,
  validateSocialLinks,
  StoreSettingsService,
} from "../services/store-settings-service"
import { GET as getSettings, PATCH as patchSettings } from "../route"
import { GET as getPublicStoreSettings } from "../../../store/settings/route"
import { GET as listAddresses, POST as createAddress } from "../addresses/route"
import { PATCH as updateAddress, DELETE as deleteAddress } from "../addresses/[id]/route"
import { PUT as setDefaultShippingAddress } from "../default-shipping-address/route"
import { PUT as setDefaultReturnAddress } from "../default-return-address/route"
import { MedusaError } from "@medusajs/framework/utils"

describe("Store Settings & Addresses Module Unit and Integration Tests", () => {
  describe("Validation & Normalization Helpers", () => {
    it("should normalize Persian and Arabic numerals to ASCII digits", () => {
      expect(normalizeDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789")
      expect(normalizeDigits("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789")
      expect(normalizeDigits("۱۲۳۴۵۶۷۸۹۰")).toBe("1234567890")
    })

    it("should validate and clean phone numbers, preserving leading zeros", () => {
      expect(validateAndCleanPhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789")
      expect(validateAndCleanPhone("021-88888888")).toBe("02188888888")

      expect(() => validateAndCleanPhone("123")).toThrow(MedusaError)
      expect(() => validateAndCleanPhone("12345678901234")).toThrow(MedusaError)
      expect(() => validateAndCleanPhone("")).toThrow(MedusaError)
    })

    it("should validate and clean Iranian postal codes requiring exactly 10 digits", () => {
      expect(validateAndCleanPostalCode("۱۲۳۴۵۶۷۸۹۰")).toBe("1234567890")
      expect(validateAndCleanPostalCode("0123456789")).toBe("0123456789")

      expect(() => validateAndCleanPostalCode("123456789")).toThrow(MedusaError)
      expect(() => validateAndCleanPostalCode("12345678901")).toThrow(MedusaError)
      expect(() => validateAndCleanPostalCode("abc")).toThrow(MedusaError)
    })

    it("should validate email format", () => {
      expect(validateEmail("support@mepusham.ir")).toBe(true)
      expect(validateEmail("")).toBe(true) // optional email
      expect(validateEmail("invalid-email")).toBe(false)
    })
  })

  describe("StoreSettingsService Logic & Defaults", () => {
    let mockStoreService: any
    let mockContainer: any
    let service: StoreSettingsService

    let settingsDb: any[] = []
    let addressesDb: any[] = []

    beforeEach(() => {
      settingsDb = []
      addressesDb = []

      mockStoreService = {
        listStoreSettings: jest.fn().mockImplementation(async () => settingsDb),
        createStoreSettings: jest.fn().mockImplementation(async (data: any[]) => {
          const created = data.map((d, i) => ({
            id: `stset_${i + 1}`,
            ...d,
            created_at: new Date(),
            updated_at: new Date(),
          }))
          settingsDb.push(...created)
          return created
        }),
        updateStoreSettings: jest.fn().mockImplementation(async (data: any) => {
          const items = Array.isArray(data) ? data : [data]
          const updated: any[] = []
          for (const item of items) {
            if (!item || typeof item !== "object" || typeof item.id !== "string") {
              throw new TypeError(
                "MedusaService update expects an object/array with id, not positional (id, data)"
              )
            }
            const idx = settingsDb.findIndex((s) => s.id === item.id)
            if (idx === -1) {
              throw new Error("Settings not found")
            }
            settingsDb[idx] = { ...settingsDb[idx], ...item }
            updated.push(settingsDb[idx])
          }
          return Array.isArray(data) ? updated : updated[0]
        }),
        listStoreAddresses: jest.fn().mockImplementation(async () => addressesDb),
        createStoreAddresses: jest.fn().mockImplementation(async (data: any[]) => {
          const created = data.map((d, i) => ({
            id: `staddr_${addressesDb.length + i + 1}`,
            ...d,
            created_at: new Date(),
            updated_at: new Date(),
          }))
          addressesDb.push(...created)
          return created
        }),
        retrieveStoreAddress: jest.fn().mockImplementation(async (id: string) => {
          const found = addressesDb.find((a) => a.id === id)
          if (!found) throw new Error("Address not found")
          return found
        }),
        updateStoreAddresses: jest.fn().mockImplementation(async (data: any) => {
          const items = Array.isArray(data) ? data : [data]
          const updated: any[] = []
          for (const item of items) {
            if (!item || typeof item !== "object" || typeof item.id !== "string") {
              throw new TypeError(
                "MedusaService update expects an object/array with id, not positional (id, data)"
              )
            }
            const idx = addressesDb.findIndex((a) => a.id === item.id)
            if (idx === -1) {
              throw new Error("Address not found")
            }
            addressesDb[idx] = { ...addressesDb[idx], ...item }
            updated.push(addressesDb[idx])
          }
          return Array.isArray(data) ? updated : updated[0]
        }),
        deleteStoreAddresses: jest.fn().mockImplementation(async (id: string) => {
          addressesDb = addressesDb.filter((a) => a.id !== id)
          return true
        }),
      }

      mockContainer = {
        resolve: jest.fn().mockReturnValue(mockStoreService),
      }

      service = new StoreSettingsService(mockContainer)
    })

    it("should initialize default settings when no settings record exists", async () => {
      const settings = await service.getSettings()

      expect(settings.storeName).toBe("Mepusham")
      expect(settings.taxRate).toBe(0)
      expect(settings.enableSmsNotifications).toBe(true)
      expect(settings.enableEmailNotifications).toBe(true)
      expect(settings.returnWindowDays).toBe(2)
      expect(settings.autoApproveReturns).toBe(false)
      expect(settings.defaultShippingAddressId).toBeNull()
      expect(settings.defaultReturnAddressId).toBeNull()
      expect(settings.addresses).toEqual([])
    })

    it("should update settings selectively while preserving omitted fields", async () => {
      await service.getSettings() // initialize

      const updated = await service.updateSettings({
        storeName: "Mepusham Boutique",
        taxRate: 9,
        enableSmsNotifications: false,
      })

      expect(updated.storeName).toBe("Mepusham Boutique")
      expect(updated.taxRate).toBe(9)
      expect(updated.enableSmsNotifications).toBe(false)
      expect(updated.enableEmailNotifications).toBe(true) // preserved
      expect(updated.returnWindowDays).toBe(2) // preserved
    })

    it("should reject invalid settings values", async () => {
      await service.getSettings()

      // Empty store name
      await expect(service.updateSettings({ storeName: "   " })).rejects.toThrow(MedusaError)

      // Invalid phone
      await expect(service.updateSettings({ contactPhone: "123" })).rejects.toThrow(MedusaError)

      // Invalid email
      await expect(service.updateSettings({ supportEmail: "invalid-email" })).rejects.toThrow(MedusaError)

      // Negative tax rate
      await expect(service.updateSettings({ taxRate: -5 })).rejects.toThrow(MedusaError)

      // Non-positive return window days
      await expect(service.updateSettings({ returnWindowDays: 0 })).rejects.toThrow(MedusaError)

      // Server-managed field attempt
      await expect(service.updateSettings({ id: "custom_id" })).rejects.toThrow(MedusaError)
    })

    it("should create first address and automatically set as shipping & return default", async () => {
      const addr = await service.createAddress({
        title: "Main Warehouse",
        recipientName: "Manager",
        phone: "۰۹۱۲۳۴۵۶۷۸۹",
        province: "Tehran",
        city: "Tehran",
        address: "Azadi Ave No 10",
        postalCode: "۱۲۳۴۵۶۷۸۹۰",
      })

      expect(addr.title).toBe("Main Warehouse")
      expect(addr.phone).toBe("09123456789")
      expect(addr.postalCode).toBe("1234567890")

      const settings = await service.getSettings()
      expect(settings.defaultShippingAddressId).toBe(addr.id)
      expect(settings.defaultReturnAddressId).toBe(addr.id)
    })

    it("should set shipping and return defaults independently", async () => {
      const addr1 = await service.createAddress({
        title: "Warehouse 1",
        recipientName: "Recipient 1",
        phone: "09123456789",
        province: "Tehran",
        city: "Tehran",
        address: "Address 1",
        postalCode: "1111111111",
      })

      const addr2 = await service.createAddress({
        title: "Warehouse 2",
        recipientName: "Recipient 2",
        phone: "09123456788",
        province: "Tehran",
        city: "Tehran",
        address: "Address 2",
        postalCode: "2222222222",
      })

      await service.setDefaultShippingAddress(addr1.id)
      await service.setDefaultReturnAddress(addr2.id)

      const settings = await service.getSettings()
      expect(settings.defaultShippingAddressId).toBe(addr1.id)
      expect(settings.defaultReturnAddressId).toBe(addr2.id)
    })

    it("should reject setting a non-existent address ID as default", async () => {
      await expect(service.setDefaultShippingAddress("non_existent_id")).rejects.toThrow(MedusaError)
      await expect(service.setDefaultReturnAddress("non_existent_id")).rejects.toThrow(MedusaError)
    })

    it("should delete default address and reassign default to first remaining address atomically", async () => {
      const addr1 = await service.createAddress({
        title: "Warehouse 1",
        recipientName: "R1",
        phone: "09123456789",
        province: "Tehran",
        city: "Tehran",
        address: "A1",
        postalCode: "1111111111",
      })

      const addr2 = await service.createAddress({
        title: "Warehouse 2",
        recipientName: "R2",
        phone: "09123456788",
        province: "Tehran",
        city: "Tehran",
        address: "A2",
        postalCode: "2222222222",
      })

      // Set addr1 as shipping default and addr2 as return default
      await service.setDefaultShippingAddress(addr1.id)
      await service.setDefaultReturnAddress(addr2.id)

      // Delete addr1
      await service.deleteAddress(addr1.id)

      const settings = await service.getSettings()
      // Default shipping address should be reassigned to addr2 (first remaining address)
      expect(settings.defaultShippingAddressId).toBe(addr2.id)
      expect(settings.defaultReturnAddressId).toBe(addr2.id)
    })

    it("should set defaults to null when the last address is deleted", async () => {
      const addr1 = await service.createAddress({
        title: "Only Warehouse",
        recipientName: "R1",
        phone: "09123456789",
        province: "Tehran",
        city: "Tehran",
        address: "A1",
        postalCode: "1111111111",
      })

      await service.deleteAddress(addr1.id)

      const settings = await service.getSettings()
      expect(settings.defaultShippingAddressId).toBeNull()
      expect(settings.defaultReturnAddressId).toBeNull()
      expect(settings.addresses).toEqual([])
    })

    it("should resolve historical address snapshots accurately", async () => {
      const addr1 = await service.createAddress({
        title: "Shipping Depot",
        recipientName: "Depot Manager",
        phone: "09123456789",
        province: "Tehran",
        city: "Tehran",
        address: "Main Depot St",
        plaque: "12",
        floor: "1",
        postalCode: "1234567890",
      })

      const snapshotBeforeEdit = await service.getShippingAddressSnapshot()
      expect(snapshotBeforeEdit).toEqual({
        title: "Shipping Depot",
        recipientName: "Depot Manager",
        phone: "09123456789",
        province: "Tehran",
        city: "Tehran",
        address: "Main Depot St",
        plaque: "12",
        floor: "1",
        postalCode: "1234567890",
      })

      // Edit master address record
      await service.updateAddress(addr1.id, { title: "Renamed Depot", address: "New Depot St" })

      // Captured snapshot object remains unchanged in historical records
      expect(snapshotBeforeEdit.title).toBe("Shipping Depot")
      expect(snapshotBeforeEdit.address).toBe("Main Depot St")
    })

    it("should calculate return eligibility correctly based on delivery timestamp and returnWindowDays", () => {
      const now = Date.now()
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)

      // 2-day return window
      expect(service.isReturnEligible(oneDayAgo, 2)).toBe(true)
      expect(service.isReturnEligible(threeDaysAgo, 2)).toBe(false)
    })
  })

  describe("API Endpoint Handlers", () => {
    let req: any
    let res: any
    let mockStoreService: any

    beforeEach(() => {
      mockStoreService = {
        listStoreSettings: jest.fn().mockResolvedValue([
          {
            id: "stset_1",
            store_name: "Mepusham",
            contact_phone: "09123456789",
            support_email: "support@mepusham.ir",
            address: "",
            tax_rate: 0,
            enable_sms_notifications: true,
            enable_email_notifications: true,
            return_window_days: 2,
            auto_approve_returns: false,
            default_shipping_address_id: "staddr_1",
            default_return_address_id: "staddr_1",
          },
        ]),
        listStoreAddresses: jest.fn().mockResolvedValue([
          {
            id: "staddr_1",
            title: "Main Warehouse",
            recipient_name: "Admin",
            phone: "09123456789",
            province: "Tehran",
            city: "Tehran",
            address: "Street 1",
            postal_code: "1234567890",
          },
        ]),
        updateStoreSettings: jest.fn().mockImplementation(async (data: any) => {
          if (!data || typeof data !== "object" || typeof data.id !== "string") {
            throw new TypeError(
              "MedusaService update expects an object/array with id, not positional (id, data)"
            )
          }
          return data
        }),
        retrieveStoreAddress: jest.fn().mockResolvedValue({
          id: "staddr_1",
          title: "Main Warehouse",
          recipient_name: "Admin",
          phone: "09123456789",
          province: "Tehran",
          city: "Tehran",
          address: "Street 1",
          postal_code: "1234567890",
        }),
      }

      req = {
        scope: {
          resolve: jest.fn().mockReturnValue(mockStoreService),
        },
        body: {},
        params: {},
      }

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
    })

    it("GET /admin/settings handler should return settings and addresses", async () => {
      await getSettings(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          storeName: "Mepusham",
          contactPhone: "09123456789",
          defaultShippingAddressId: "staddr_1",
          addresses: expect.arrayContaining([
            expect.objectContaining({ id: "staddr_1", title: "Main Warehouse" }),
          ]),
        })
      )
    })

    it("PATCH /admin/settings handler should update store settings", async () => {
      req.body = { storeName: "Updated Store Name" }

      await patchSettings(req, res)

      expect(mockStoreService.updateStoreSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "stset_1",
          store_name: "Updated Store Name",
        })
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("PUT /admin/settings/default-shipping-address handler should set shipping default", async () => {
      req.body = { addressId: "staddr_1" }

      await setDefaultShippingAddress(req, res)

      expect(mockStoreService.updateStoreSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "stset_1",
          default_shipping_address_id: "staddr_1",
        })
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("PUT /admin/settings/default-return-address handler should set return default", async () => {
      req.body = { addressId: "staddr_1" }

      await setDefaultReturnAddress(req, res)

      expect(mockStoreService.updateStoreSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "stset_1",
          default_return_address_id: "staddr_1",
        })
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("GET /store/settings handler should return only the 7 public fields and exclude internal admin fields", async () => {
      mockStoreService.listStoreSettings.mockResolvedValue([
        {
          id: "stset_1",
          store_name: "ابزارمارکت",
          logo_id: "media_1",
          logo_url: "https://cdn.example.com/uploads/logo.png",
          brand_description: "فروشگاه تخصصی ابزارآلات صنعتی",
          address: "تهران، خیابان امام خمینی",
          contact_phone: "02188776655",
          contact_phones: [
            { label: "فروش و مشاوره", number: "021-88776655" },
            { label: "پشتیبانی", number: "09121234567" },
          ],
          social_links: [
            { platform: "instagram", url: "https://instagram.com/abzarmarket" },
          ],
          tax_rate: 9,
          auto_approve_returns: true,
          return_window_days: 7,
          support_email: "internal@example.com",
          default_shipping_address_id: "staddr_1",
          updated_at: "2026-11-27T17:00:00.000Z",
        },
      ])

      await getPublicStoreSettings(req, res)

      expect(mockStoreService.listStoreAddresses).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)

      const payload = res.json.mock.calls[0][0]
      expect(Object.keys(payload).sort()).toEqual([
        "address",
        "brandDescription",
        "contactPhones",
        "logoUrl",
        "socialLinks",
        "storeName",
        "updatedAt",
      ])
      expect(payload).toEqual({
        storeName: "ابزارمارکت",
        logoUrl: "https://cdn.example.com/uploads/logo.png",
        brandDescription: "فروشگاه تخصصی ابزارآلات صنعتی",
        address: "تهران، خیابان امام خمینی",
        contactPhones: [
          { label: "فروش و مشاوره", number: "021-88776655" },
          { label: "پشتیبانی", number: "09121234567" },
        ],
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/abzarmarket" },
        ],
        updatedAt: "2026-11-27T17:00:00.000Z",
      })
      expect(payload.taxRate).toBeUndefined()
      expect(payload.autoApproveReturns).toBeUndefined()
      expect(payload.addresses).toBeUndefined()
      expect(payload.supportEmail).toBeUndefined()
      expect(payload.returnWindowDays).toBeUndefined()
      expect(payload.id).toBeUndefined()
      expect(payload.logoId).toBeUndefined()
    })
  })

  describe("Public Brand Identity, Contact Phones & Social Links Validation", () => {
    let mockStoreService: any
    let service: StoreSettingsService
    let settingsDb: any[]

    beforeEach(() => {
      settingsDb = [
        {
          id: "stset_1",
          store_name: "Mepusham",
          logo_id: null,
          logo_url: null,
          brand_description: "",
          contact_phone: "09120000000",
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
          created_at: new Date("2026-11-27T10:00:00.000Z"),
          updated_at: new Date("2026-11-27T10:00:00.000Z"),
        },
      ]
      mockStoreService = {
        listStoreSettings: jest.fn().mockImplementation(async () => settingsDb),
        createStoreSettings: jest.fn(),
        updateStoreSettings: jest.fn().mockImplementation(async (data: any) => {
          if (!data || typeof data !== "object" || typeof data.id !== "string") {
            throw new TypeError(
              "MedusaService update expects an object/array with id, not positional (id, data)"
            )
          }
          settingsDb[0] = { ...settingsDb[0], ...data }
          return settingsDb[0]
        }),
        listStoreAddresses: jest.fn().mockResolvedValue([]),
      }
      service = new StoreSettingsService({ resolve: () => mockStoreService })
    })

    it("should enforce storeName (2..60 chars), brandDescription (<=300), and address (<=300) bounds", async () => {
      await expect(service.updateSettings({ storeName: "ا" })).rejects.toThrow(MedusaError)
      await expect(service.updateSettings({ storeName: "a".repeat(61) })).rejects.toThrow(MedusaError)
      await expect(service.updateSettings({ brandDescription: "a".repeat(301) })).rejects.toThrow(MedusaError)
      await expect(service.updateSettings({ address: "ت".repeat(301) })).rejects.toThrow(MedusaError)

      const updated = await service.updateSettings({
        storeName: "ابزارمارکت",
        brandDescription: "ت".repeat(300),
        address: "ت".repeat(300),
      })
      expect(updated.storeName).toBe("ابزارمارکت")
      expect(updated.brandDescription).toHaveLength(300)
      expect(updated.address).toHaveLength(300)

      const cleared = await service.updateSettings({ brandDescription: null, address: null })
      expect(cleared.brandDescription).toBe("")
      expect(cleared.address).toBe("")
    })

    it("should validate logoUrl and clear logoId when logoUrl is cleared with null", async () => {
      expect(validateLogoUrl("https://cdn.example.com/uploads/logo.png")).toBe(
        "https://cdn.example.com/uploads/logo.png"
      )
      expect(validateLogoUrl("/uploads/logo.webp")).toBe("/uploads/logo.webp")
      expect(validateLogoUrl("/api/medusa/uploads/logo.png")).toBe("/api/medusa/uploads/logo.png")
      expect(validateLogoUrl(null)).toBeNull()
      expect(() => validateLogoUrl("/uploads/../etc/passwd")).toThrow(MedusaError)
      expect(() => validateLogoUrl("javascript:alert(1)")).toThrow(MedusaError)
      expect(() => validateLogoUrl("data:image/png;base64,AAA")).toThrow(MedusaError)
      expect(() => validateLogoUrl("not-a-valid-url")).toThrow(MedusaError)

      const setRes = await service.updateSettings({
        logoId: "media_123",
        logoUrl: "/uploads/logo.png",
      })
      expect(setRes.logoId).toBe("media_123")
      expect(setRes.logoUrl).toBe("/uploads/logo.png")

      const clearedRes = await service.updateSettings({ logoUrl: null })
      expect(clearedRes.logoUrl).toBeNull()
      expect(clearedRes.logoId).toBeNull()
    })

    it("should validate contactPhones (1..5 items), preserve hyphens, and sync legacy contactPhone", async () => {
      expect(validateContactPhoneNumber("۰۲۱-۸۸۷۷۶۶۵۵")).toBe("021-88776655")
      expect(() => validateContactPhones([])).toThrow(MedusaError)
      expect(() =>
        validateContactPhones([
          { label: "1", number: "09121111111" },
          { label: "2", number: "09121111112" },
          { label: "3", number: "09121111113" },
          { label: "4", number: "09121111114" },
          { label: "5", number: "09121111115" },
          { label: "6", number: "09121111116" },
        ])
      ).toThrow(MedusaError)
      expect(() => validateContactPhones([{ label: "", number: "09121234567" }])).toThrow(MedusaError)
      expect(() => validateContactPhones([{ label: "a".repeat(41), number: "09121234567" }])).toThrow(MedusaError)
      expect(() => validateContactPhones([{ label: "پشتیبانی", number: "abc" }])).toThrow(MedusaError)

      const updated = await service.updateSettings({
        contactPhones: [
          { label: "فروش و مشاوره", number: "۰۲۱-۸۸۷۷۶۶۵۵" },
          { label: "پشتیبانی", number: "09121234567" },
        ],
      })
      expect(updated.contactPhones).toEqual([
        { label: "فروش و مشاوره", number: "021-88776655" },
        { label: "پشتیبانی", number: "09121234567" },
      ])
      expect(updated.contactPhone).toBe("02188776655")
    })

    it("should fall back to legacy contactPhone when contact_phones is empty", async () => {
      const pub = await service.getPublicSettings()
      expect(pub.contactPhones).toEqual([{ label: "پشتیبانی", number: "09120000000" }])
    })

    it("should validate socialLinks (0..6 items, allowed platforms only, unique platforms, valid http/https URL)", async () => {
      expect(validateSocialLinks([])).toEqual([])
      expect(() =>
        validateSocialLinks([
          { platform: "instagram", url: "https://instagram.com/a" },
          { platform: "whatsapp", url: "https://wa.me/98912" },
          { platform: "telegram", url: "https://t.me/a" },
          { platform: "aparat", url: "https://aparat.com/a" },
          { platform: "linkedin", url: "https://linkedin.com/company/a" },
          { platform: "youtube", url: "https://youtube.com/@a" },
          { platform: "twitter", url: "https://x.com/a" },
        ])
      ).toThrow(MedusaError)
      expect(() =>
        validateSocialLinks([{ platform: "tiktok", url: "https://tiktok.com/@a" }])
      ).toThrow(MedusaError)
      expect(() =>
        validateSocialLinks([
          { platform: "instagram", url: "https://instagram.com/a" },
          { platform: "INSTAGRAM", url: "https://instagram.com/b" },
        ])
      ).toThrow(MedusaError)
      expect(() =>
        validateSocialLinks([{ platform: "instagram", url: "ftp://instagram.com/a" }])
      ).toThrow(MedusaError)

      const updated = await service.updateSettings({
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/abzarmarket" },
          { platform: "whatsapp", url: "https://wa.me/989121234567" },
          { platform: "telegram", url: "https://t.me/abzarmarket" },
          { platform: "aparat", url: "https://www.aparat.com/abzarmarket" },
          { platform: "linkedin", url: "https://www.linkedin.com/company/abzarmarket" },
          { platform: "youtube", url: "https://youtube.com/@abzarmarket" },
        ],
      })
      expect(updated.socialLinks).toHaveLength(6)
      expect((await service.getPublicSettings()).socialLinks).toHaveLength(6)
    })
  })
})
