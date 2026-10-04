/**
 * Normalizes phone numbers, specifically supporting Iranian formats and general E.164 formats.
 * Handles Persian/Arabic digits and converts them to standard ASCII digits.
 */

const PERSIAN_ARABIC_DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
}

export function convertDigitsToAscii(str: string): string {
  if (!str) return ""
  return str.replace(/[۰-۹0-9]/g, (char) => PERSIAN_ARABIC_DIGITS[char] ?? char)
}

export function normalizePhoneNumber(
  phone: string,
  options: { format?: "e164" | "local" } = { format: "e164" }
): string {
  if (!phone) {
    return ""
  }

  // 1. Convert Persian/Arabic digits
  let cleaned = convertDigitsToAscii(phone.trim())

  // 2. Remove all non-digit characters except leading '+'
  const hasPlus = cleaned.startsWith("+")
  cleaned = cleaned.replace(/\D/g, "")

  if (!cleaned) {
    return ""
  }

  // 3. Check for Iranian phone number patterns
  // Pattern 1: 09xxxxxxxxx (11 digits starting with 09)
  if (cleaned.length === 11 && cleaned.startsWith("09")) {
    const subscriber = cleaned.slice(1) // 9xxxxxxxxx
    return options.format === "local" ? `0${subscriber}` : `+98${subscriber}`
  }

  // Pattern 2: 989xxxxxxxxx (12 digits starting with 989)
  if (cleaned.length === 12 && cleaned.startsWith("989")) {
    const subscriber = cleaned.slice(2) // 9xxxxxxxxx
    return options.format === "local" ? `0${subscriber}` : `+98${subscriber}`
  }

  // Pattern 3: 9xxxxxxxxx (10 digits starting with 9)
  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    return options.format === "local" ? `0${cleaned}` : `+98${cleaned}`
  }

  // 4. Fallback for international / other phone formats
  if (options.format === "local" && cleaned.startsWith("98")) {
    return `0${cleaned.slice(2)}`
  }

  return hasPlus ? `+${cleaned}` : `+${cleaned}`
}
