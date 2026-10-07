import {
  AddressPayload,
  isValidIranianNationalCode,
  safeHttpUrl,
} from "../common"

describe("isValidIranianNationalCode", () => {
  it("accepts valid 10-digit Iranian national codes", () => {
    expect(isValidIranianNationalCode("0010532080")).toBe(true)
  })

  it("rejects repetitive 10-digit codes", () => {
    expect(isValidIranianNationalCode("1111111111")).toBe(false)
    expect(isValidIranianNationalCode("0000000000")).toBe(false)
  })

  it("rejects invalid checksums or incorrect lengths", () => {
    expect(isValidIranianNationalCode("1234567890")).toBe(false)
    expect(isValidIranianNationalCode("12345")).toBe(false)
    expect(isValidIranianNationalCode("abcdefghij")).toBe(false)
  })
})

describe("AddressPayload - Iranian Address Validation", () => {
  it("accepts a valid Iranian address payload", () => {
    const validIranianAddress = {
      first_name: "علی",
      last_name: "رضایی",
      phone: "09123456789",
      address_1: "خیابان آزادی، کوچه اول",
      address_2: "پلاک ۱۰، طبقه ۲",
      city: "تهران",
      province: "تهران",
      country_code: "ir",
      postal_code: "1234567890",
      metadata: {
        national_code: "0010532080",
      },
    }

    const result = AddressPayload.safeParse(validIranianAddress)
    expect(result.success).toBe(true)
  })

  it("rejects an Iranian address with invalid national_code in metadata", () => {
    const invalidAddress = {
      first_name: "علی",
      last_name: "رضایی",
      phone: "09123456789",
      address_1: "خیابان آزادی",
      city: "تهران",
      province: "تهران",
      country_code: "IR",
      postal_code: "1234567890",
      metadata: {
        national_code: "1111111111",
      },
    }

    const result = AddressPayload.safeParse(invalidAddress)
    expect(result.success).toBe(false)
  })

  it("rejects an Iranian address with postal_code not equal to 10 digits", () => {
    const invalidAddress = {
      phone: "09123456789",
      country_code: "ir",
      postal_code: "12345",
      metadata: {
        national_code: "0010532080",
      },
    }

    const result = AddressPayload.safeParse(invalidAddress)
    expect(result.success).toBe(false)
  })

  it("rejects an Iranian address with an invalid mobile number format", () => {
    const invalidAddress = {
      phone: "12345",
      country_code: "ir",
      postal_code: "1234567890",
      metadata: {
        national_code: "0010532080",
      },
    }

    const result = AddressPayload.safeParse(invalidAddress)
    expect(result.success).toBe(false)
  })

  it("accepts an international address without national_code or Iranian rules", () => {
    const internationalAddress = {
      first_name: "John",
      last_name: "Doe",
      phone: "+15551234567",
      address_1: "123 Main St",
      city: "New York",
      province: "NY",
      country_code: "us",
      postal_code: "10001",
    }

    const result = AddressPayload.safeParse(internationalAddress)
    expect(result.success).toBe(true)
  })
})

describe("safeHttpUrl", () => {
  it.each([
    ["https://example.com/tracking/123", "https URL"],
    ["http://example.com/label.pdf", "http URL"],
    ["", "empty string"],
    ["#", "placeholder hash"],
  ])("accepts %s (%s)", (value) => {
    expect(safeHttpUrl.safeParse(value).success).toBe(true)
  })

  it.each([
    "javascript:alert(document.domain)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "not a url",
  ])("rejects dangerous or invalid URL %s", (value) => {
    expect(safeHttpUrl.safeParse(value).success).toBe(false)
  })
})
