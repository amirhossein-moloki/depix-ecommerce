import {
  normalizeDigits,
  validateAndCleanPhone,
  validateAndCleanPostalCode,
  validateEmail,
  StoreSettingsService,
} from "../services/store-settings-service"
import { GET as getSettings, PATCH as patchSettings } from "../route"
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
        updateStoreSettings: jest.fn().mockImplementation(async (id: string, data: any) => {
          const idx = settingsDb.findIndex((s) => s.id === id)
          if (idx !== -1) {
            settingsDb[idx] = { ...settingsDb[idx], ...data }
            return settingsDb[idx]
          }
          throw new Error("Settings not found")
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
        updateStoreAddresses: jest.fn().mockImplementation(async (id: string, data: any) => {
          const idx = addressesDb.findIndex((a) => a.id === id)
          if (idx !== -1) {
            addressesDb[idx] = { ...addressesDb[idx], ...data }
            return addressesDb[idx]
          }
          throw new Error("Address not found")
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
        updateStoreSettings: jest.fn().mockResolvedValue({}),
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
        "stset_1",
        expect.objectContaining({ store_name: "Updated Store Name" })
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("PUT /admin/settings/default-shipping-address handler should set shipping default", async () => {
      req.body = { addressId: "staddr_1" }

      await setDefaultShippingAddress(req, res)

      expect(mockStoreService.updateStoreSettings).toHaveBeenCalledWith(
        "stset_1",
        expect.objectContaining({ default_shipping_address_id: "staddr_1" })
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("PUT /admin/settings/default-return-address handler should set return default", async () => {
      req.body = { addressId: "staddr_1" }

      await setDefaultReturnAddress(req, res)

      expect(mockStoreService.updateStoreSettings).toHaveBeenCalledWith(
        "stset_1",
        expect.objectContaining({ default_return_address_id: "staddr_1" })
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
