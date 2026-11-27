import { z } from "@medusajs/framework/zod"

export const BANNER_PLACEMENTS = ["hero_main", "hero_secondary"] as const

export const BannerPlacementSchema = z.enum(BANNER_PLACEMENTS)

/**
 * Validates that link_url is either a safe internal path starting with `/` (not `//`)
 * or an `http://` / `https://` URL. Rejects `javascript:`, `data:`, protocol-relative `//`, etc.
 */
export function isValidBannerLinkUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//")
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const LinkUrlSchema = z
  .string()
  .trim()
  .refine(isValidBannerLinkUrl, {
    message:
      "link_url must be an internal path starting with '/' (not '//') or an http(s):// URL",
  })
  .transform((v) => (v === "" ? null : v))

export const AdminCreateBanner = z.object({
  title: z.string().nullish(),
  placement: BannerPlacementSchema.default("hero_main"),
  image_url: z.string().trim().min(1, "image_url is required"),
  link_url: LinkUrlSchema.nullish(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type AdminCreateBannerType = z.infer<typeof AdminCreateBanner>

export const AdminUpdateBanner = z.object({
  title: z.string().nullish(),
  placement: BannerPlacementSchema.optional(),
  image_url: z.string().trim().min(1, "image_url cannot be empty").optional(),
  link_url: LinkUrlSchema.nullish(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type AdminUpdateBannerType = z.infer<typeof AdminUpdateBanner>

const ReorderItemSchema = z.object({
  id: z.string().min(1),
  sort_order: z.number().int(),
})

export const AdminReorderBanners = z.union([
  z.array(ReorderItemSchema).min(1),
  z.object({
    items: z.array(ReorderItemSchema).min(1),
  }),
  z.object({
    banners: z.array(ReorderItemSchema).min(1),
  }),
])

export type AdminReorderBannersType = z.infer<typeof AdminReorderBanners>
