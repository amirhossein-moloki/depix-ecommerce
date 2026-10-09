import { SmsNotificationService } from "../services/sms"
import { normalizePhoneNumber } from "../utils/phone-normalizer"
import { renderNotificationTemplate } from "../utils/template-renderer"

describe("Phone Normalizer Utility", () => {
  it("normalizes Iranian phone numbers in local format (09123456789) to E.164 (+989123456789)", () => {
    expect(normalizePhoneNumber("09123456789")).toBe("+989123456789")
  })

  it("normalizes Iranian phone numbers with +98 prefix (+989123456789)", () => {
    expect(normalizePhoneNumber("+989123456789")).toBe("+989123456789")
  })

  it("normalizes Iranian phone numbers with 98 prefix (989123456789)", () => {
    expect(normalizePhoneNumber("989123456789")).toBe("+989123456789")
  })

  it("converts Persian and Arabic digits to ASCII digits", () => {
    expect(normalizePhoneNumber("۰۹۱۲۳۴۵۶۷۸۹")).toBe("+989123456789")
  })

  it("handles general international phone numbers with plus", () => {
    expect(normalizePhoneNumber("+14155552671")).toBe("+14155552671")
  })
})

describe("Template Renderer Utility", () => {
  it("renders back-in-stock default template with dynamic variables", () => {
    const rendered = renderNotificationTemplate("back-in-stock", {
      product_title: "کفش ورزشی",
      variant_title: "سایز ۴۲",
    })
    expect(rendered).toContain("کفش ورزشی")
    expect(rendered).toContain("سایز ۴۲")
  })

  it("renders custom string templates with handlebars syntax", () => {
    const rendered = renderNotificationTemplate("سلام {{name}} عزیز، کد: {{code}}", {
      name: "علی",
      code: "1234",
    })
    expect(rendered).toBe("سلام علی عزیز، کد: 1234")
  })
})

describe("SmsNotificationService Provider", () => {
  let service: SmsNotificationService

  beforeEach(() => {
    SmsNotificationService.sentMessages = []
    service = new SmsNotificationService(
      { logger: console as any },
      { provider: "fake" }
    )
  })

  it("successfully sends fake SMS in test environment", async () => {
    const res = await service.send({
      channel: "sms",
      template: "back-in-stock",
      to: "09123456789",
      data: { product_title: "لپ تاپ" },
    })

    expect(res.id).toBeDefined()
    expect(SmsNotificationService.sentMessages).toHaveLength(1)
    expect(SmsNotificationService.sentMessages[0].to).toBe("+989123456789")
    expect(SmsNotificationService.sentMessages[0].message).toContain("لپ تاپ")
  })

  it("throws INVALID_DATA error if 'to' is missing", async () => {
    await expect(
      service.send({
        channel: "sms",
        template: "back-in-stock",
        to: "",
      })
    ).rejects.toThrow("Recipient ('to') is required for SMS notification")
  })

  it("handles mocked external API response when running external provider", async () => {
    const externalService = new SmsNotificationService(
      { logger: console as any },
      {
        provider: "kavenegar",
        api_key: "test_key",
        api_url: "https://api.test/send",
      }
    )

    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageid: "ext_msg_100" }),
    } as any)

    // Force NODE_ENV to non-test temporarily for external send path
    const origEnv = process.env.NODE_ENV
    delete process.env.NODE_ENV

    try {
      const res = await externalService.send({
        channel: "sms",
        template: "order-placed",
        to: "09123456789",
        content: { text: "تست پیامک" },
      })
      expect(res.id).toBe("ext_msg_100")
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.test/send",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-API-KEY": "test_key" }),
        })
      )
    } finally {
      process.env.NODE_ENV = origEnv
      global.fetch = originalFetch
    }
  })
})
