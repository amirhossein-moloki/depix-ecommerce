import { z } from "@medusajs/framework/zod"

/**
 * Validates a 10-digit Iranian national code (کد ملی) using standard checksum.
 */
export function isValidIranianNationalCode(code: string): boolean {
  if (typeof code !== "string" || !/^\d{10}$/.test(code)) {
    return false
  }
  if (/^(\d)\1{9}$/.test(code)) {
    return false
  }
  const check = parseInt(code[9], 10)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i], 10) * (10 - i)
  }
  const remainder = sum % 11
  return remainder < 2 ? check === remainder : check === 11 - remainder
}

/**
 * Refines an address schema to enforce Iranian address validation rules when country_code is "ir".
 */
export function refineIranianAddress<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: any, ctx: z.RefinementCtx) => {
    if (
      data &&
      typeof data === "object" &&
      data.country_code?.toLowerCase() === "ir"
    ) {
      if (!data.postal_code || !/^\d{10}$/.test(String(data.postal_code))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Iranian postal_code must be exactly 10 digits",
          path: ["postal_code"],
        })
      }
      if (
        !data.phone ||
        !/^(\+98|0)?9\d{9}$/.test(String(data.phone).replace(/\s+/g, ""))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Iranian phone number must be a valid 11-digit mobile number (e.g. 09123456789)",
          path: ["phone"],
        })
      }
      const nationalCode = data.metadata?.national_code
      if (
        !nationalCode ||
        !isValidIranianNationalCode(String(nationalCode))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A valid Iranian national_code is required in metadata for Iranian addresses",
          path: ["metadata", "national_code"],
        })
      }
    }
  })
}

export const AddressPayloadInner = z
  .object({
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    phone: z.string().nullish(),
    company: z.string().nullish(),
    address_1: z.string().nullish(),
    address_2: z.string().nullish(),
    city: z.string().nullish(),
    country_code: z.string().nullish(),
    province: z.string().nullish(),
    postal_code: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export const AddressPayload = refineIranianAddress(AddressPayloadInner)

/**
 * Validates that a string is either empty, the placeholder "#", or a URL using
 * the http: or https: scheme. Rejects dangerous schemes such as javascript:,
 * data:, and vbscript: that can lead to stored XSS when rendered in an href.
 */
export const safeHttpUrl = z.string().refine(
  (value) => {
    if (value === "" || value === "#") {
      return true
    }
    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  },
  { message: "URL must use http: or https: scheme" }
)

export const BigNumberInput = z.union([
  z.number(),
  z.string(),
  z.object({
    value: z.string(),
    precision: z.number(),
  }),
])

/**
 * Return a zod object to apply the $and and $or operators on a schema.
 *
 * @param {ZodObject<any>} schema
 * @return {ZodObject<any>}
 */
export const applyAndAndOrOperators = <T extends z.ZodObject<any>>(
  schema: T
) => {
  return schema.merge(
    z.object({
      $and: z.lazy(() => schema.array()).optional(),
      $or: z.lazy(() => schema.array()).optional(),
    })
  )
}

/**
 * Validates that a value is a boolean when it is passed as a string.
 */
export const booleanString = () =>
  z
    .union([z.boolean(), z.string()])
    .refine((value) => {
      return ["true", "false"].includes(value.toString().toLowerCase())
    })
    .transform((value) => {
      return value.toString().toLowerCase() === "true"
    })

/**
 * Apply a transformer on a schema when the data are validated and recursively normalize the data $and and $or.
 *
 * @param {(data: Data) => NormalizedData} transform
 * @return {(data: Data) => NormalizedData}
 */
export function recursivelyNormalizeSchema<
  Data extends object,
  NormalizedData extends object
>(transform: (data: Data) => NormalizedData): (data: Data) => NormalizedData {
  return (data: any) => {
    const normalizedData = transform(data)

    Object.keys(normalizedData)
      .filter((key) => ["$and", "$or"].includes(key))
      .forEach((key) => {
        normalizedData[key] = normalizedData[key].map(transform)
      })

    return normalizedData
  }
}
