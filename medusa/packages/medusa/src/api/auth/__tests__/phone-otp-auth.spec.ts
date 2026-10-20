import { normalizePhoneNumber } from "../../../modules/providers/notification-sms/src/utils/phone-normalizer"
import { SmsNotificationService } from "../../../modules/providers/notification-sms/src/services/sms"
import { POST as sendOtpHandler, memoryOtpStore } from "../phone/send-otp/route"
import { POST as verifyOtpHandler } from "../phone/verify/route"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

describe("Phone-Number & OTP Authentication Flow", () => {
  beforeEach(() => {
    SmsNotificationService.sentMessages = []
    memoryOtpStore.clear()
  })

  describe("1. Phone Number Normalization", () => {
    it("should normalize Persian/Arabic digits and local 09xx phone numbers to E.164", () => {
      expect(normalizePhoneNumber("09123456789")).toBe("+989123456789")
      expect(normalizePhoneNumber("۰۹۱۲۳۴۵۶۷۸۹")).toBe("+989123456789")
      expect(normalizePhoneNumber("+989123456789")).toBe("+989123456789")
      expect(normalizePhoneNumber("989123456789")).toBe("+989123456789")
      expect(normalizePhoneNumber("9123456789")).toBe("+989123456789")
    })

    it("should format local phone numbers when requested", () => {
      expect(normalizePhoneNumber("09123456789", { format: "local" })).toBe("09123456789")
      expect(normalizePhoneNumber("+989123456789", { format: "local" })).toBe("09123456789")
    })
  })

  describe("2. Request OTP Endpoint (POST /auth/phone/send-otp)", () => {
    it("should send OTP via SMS and store in memory cache", async () => {
      const req: any = {
        validatedBody: { phone: "09123456789" },
        scope: {
          resolve: jest.fn((key) => {
            if (key === ContainerRegistrationKeys.LOGGER) return console
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock }

      await sendOtpHandler(req, res)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phone: "+989123456789",
        })
      )

      expect(SmsNotificationService.sentMessages).toHaveLength(1)
      expect(SmsNotificationService.sentMessages[0].to).toBe("+989123456789")
      expect(SmsNotificationService.sentMessages[0].message).toContain("کد تایید ورود")

      const stored = memoryOtpStore.get("otp:phone:+989123456789")
      expect(stored).toBeDefined()
      expect(stored?.code).toMatch(/^\d{5}$/)
    })

    it("should throw error if phone is missing", async () => {
      const req: any = {
        validatedBody: {},
        scope: {
          resolve: jest.fn(),
        },
      }
      const res: any = {}

      await expect(sendOtpHandler(req, res)).rejects.toThrow("Phone number is required")
    })
  })

  describe("3. Verify OTP Endpoint (POST /auth/phone/verify)", () => {
    it("should reject verification if OTP code is invalid or expired", async () => {
      const req: any = {
        validatedBody: { phone: "09123456789", code: "00000" },
        scope: {
          resolve: jest.fn(),
        },
      }
      const res: any = {}

      await expect(verifyOtpHandler(req, res)).rejects.toThrow("Invalid or expired OTP code")
    })

    it("should create new customer account if user does not exist and return JWT token", async () => {
      // Seed memory store with valid OTP
      const phone = "09123456789"
      const normalizedPhone = "+989123456789"
      const code = "12345"
      memoryOtpStore.set(`otp:phone:${normalizedPhone}`, {
        code,
        expiresAt: Date.now() + 300000,
      })

      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [] }),
      }

      const mockAuthModule = {
        listAuthIdentities: jest.fn().mockResolvedValue([]),
        createAuthIdentities: jest.fn().mockResolvedValue({ id: "auth_id_123" }),
      }

      const mockProjectConfig = {
        projectConfig: {
          http: {
            jwtSecret: "supersecret",
            jwtExpiresIn: "1d",
          },
        },
      }

      const req: any = {
        validatedBody: { phone, code },
        scope: {
          resolve: jest.fn((key) => {
            if (key === ContainerRegistrationKeys.QUERY) return mockQuery
            if (key === Modules.AUTH) return mockAuthModule
            if (key === ContainerRegistrationKeys.CONFIG_MODULE) return mockProjectConfig
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock }

      await verifyOtpHandler(req, res)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          customer: expect.objectContaining({
            phone: normalizedPhone,
          }),
        })
      )

      // Verify OTP is cleared from memory store
      expect(memoryOtpStore.get(`otp:phone:${normalizedPhone}`)).toBeUndefined()
    })

    it("should log in existing customer and return JWT token", async () => {
      const phone = "09123456789"
      const normalizedPhone = "+989123456789"
      const code = "54321"
      memoryOtpStore.set(`otp:phone:${normalizedPhone}`, {
        code,
        expiresAt: Date.now() + 300000,
      })

      const existingCustomer = {
        id: "cust_existing_1",
        phone: normalizedPhone,
        email: "existing@example.com",
        has_account: true,
      }

      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [existingCustomer] }),
      }

      const mockAuthModule = {
        listAuthIdentities: jest.fn().mockResolvedValue([
          {
            id: "auth_id_existing",
            app_metadata: { customer_id: "cust_existing_1" },
          },
        ]),
      }

      const mockProjectConfig = {
        projectConfig: {
          http: {
            jwtSecret: "supersecret",
            jwtExpiresIn: "1d",
          },
        },
      }

      const req: any = {
        validatedBody: { phone, code },
        scope: {
          resolve: jest.fn((key) => {
            if (key === ContainerRegistrationKeys.QUERY) return mockQuery
            if (key === Modules.AUTH) return mockAuthModule
            if (key === ContainerRegistrationKeys.CONFIG_MODULE) return mockProjectConfig
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const statusMock = jest.fn().mockReturnValue({ json: jsonMock })
      const res: any = { status: statusMock }

      await verifyOtpHandler(req, res)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        token: expect.any(String),
        customer: existingCustomer,
      })
    })
  })
})
