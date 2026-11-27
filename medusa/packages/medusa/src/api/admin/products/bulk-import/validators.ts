import { ProductStatus } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

const slugRegex = /^[\p{L}\p{N}\u200c-]+$/u

export const BulkImportCategoryInput = z
  .object({
    id: z.string().min(1).optional(),
    slug: z
      .string()
      .min(1)
      .regex(
        slugRegex,
        "Category slug must contain only letters, numbers, and hyphens"
      )
      .optional(),
    name: z.string().min(1).optional(),
    parent_slug: z
      .string()
      .min(1)
      .regex(
        slugRegex,
        "Parent category slug must contain only letters, numbers, and hyphens"
      )
      .nullable()
      .optional(),
    parent_name: z.string().min(1).nullable().optional(),
    description: z.string().nullable().optional(),
    image_id: z.string().min(1).nullable().optional(),
    display_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((val) => Boolean(val.id || val.slug || val.name), {
    message: "Category must include at least one of id, slug, or name",
  })

export type BulkImportCategoryInputType = z.infer<
  typeof BulkImportCategoryInput
>

export const BulkImportBrandInput = z
  .object({
    id: z.string().min(1).optional(),
    slug: z
      .string()
      .min(1)
      .regex(
        slugRegex,
        "Brand slug must contain only letters, numbers, and hyphens"
      )
      .optional(),
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    logo_id: z.string().min(1).nullable().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((val) => Boolean(val.id || val.slug || val.name), {
    message: "Brand must include at least one of id, slug, or name",
  })

export type BulkImportBrandInputType = z.infer<typeof BulkImportBrandInput>

export const BulkImportOptionInput = z.object({
  title: z.string().min(1, "Option title is required"),
  values: z.array(z.string().min(1)).min(1, "Option values cannot be empty"),
})

export type BulkImportOptionInputType = z.infer<typeof BulkImportOptionInput>

export const BulkImportSpecificationInput = z.object({
  label: z.string().min(1, "Specification label is required"),
  value: z.string(),
})

export const BulkImportVariantInput = z
  .object({
    title: z.string().min(1).optional(),
    sku: z.string().min(1).nullable().optional(),
    barcode: z.string().min(1).nullable().optional(),
    ean: z.string().min(1).nullable().optional(),
    upc: z.string().min(1).nullable().optional(),
    price_irr: z.number().finite().min(0).optional(),
    price: z.number().finite().min(0).optional(),
    compare_at_price_irr: z.number().finite().min(0).nullable().optional(),
    compare_at_price: z.number().finite().min(0).nullable().optional(),
    stock: z.number().int().min(0).optional(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
    options: z.record(z.string(), z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (val) => val.price_irr !== undefined || val.price !== undefined,
    {
      message: "Variant must provide price_irr or price",
    }
  )

export type BulkImportVariantInputType = z.infer<typeof BulkImportVariantInput>

export const BulkImportImageItem = z.union([
  z.string().min(1),
  z.object({ url: z.string().min(1) }),
])

export const BulkImportTagItem = z.union([
  z.string().min(1),
  z.object({
    id: z.string().min(1).optional(),
    value: z.string().min(1),
  }),
])

export const BulkImportProductInput = z.object({
  title: z.string().min(1, "Product title is required"),
  subtitle: z.string().nullable().optional(),
  handle: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z
    .nativeEnum(ProductStatus)
    .optional()
    .default(ProductStatus.PUBLISHED),
  category: BulkImportCategoryInput.nullable().optional(),
  categories: z.array(BulkImportCategoryInput).optional(),
  brand: BulkImportBrandInput.nullable().optional(),
  thumbnail: z.string().min(1).nullable().optional(),
  images: z.array(BulkImportImageItem).optional(),
  tags: z.array(BulkImportTagItem).optional(),
  specifications: z.array(BulkImportSpecificationInput).optional(),
  color_hex_map: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  options: z.array(BulkImportOptionInput).optional(),
  variants: z.array(BulkImportVariantInput).optional(),
  // Optional flat fields for simple products without explicit variants array
  sku: z.string().min(1).nullable().optional(),
  barcode: z.string().min(1).nullable().optional(),
  ean: z.string().min(1).nullable().optional(),
  upc: z.string().min(1).nullable().optional(),
  price_irr: z.number().finite().min(0).optional(),
  price: z.number().finite().min(0).optional(),
  compare_at_price_irr: z.number().finite().min(0).nullable().optional(),
  compare_at_price: z.number().finite().min(0).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  manage_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
})

export type BulkImportProductInputType = z.infer<typeof BulkImportProductInput>

export const AdminBulkImportProducts = z
  .object({
    mode: z.enum(["upsert", "skip", "create_only"]).optional().default("upsert"),
    dry_run: z.boolean().optional().default(false),
    price_unit: z.enum(["irr", "irt"]).optional().default("irr"),
    download_images: z.boolean().optional().default(false),
    products: z
      .array(BulkImportProductInput)
      .min(1, "At least one product is required"),
  })
  .strict()

export type AdminBulkImportProductsType = z.infer<
  typeof AdminBulkImportProducts
>
