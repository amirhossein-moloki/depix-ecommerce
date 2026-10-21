import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const AdminGetCategoriesParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
    is_active: z
      .union([z.boolean(), z.string().transform((v) => v === "true")])
      .optional(),
    parent_category_id: z.string().nullable().optional(),
  })
)

export type AdminGetCategoriesParamsType = z.infer<
  typeof AdminGetCategoriesParams
>

export const AdminCreateCategory = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/i, "Slug must contain only alphanumeric characters and hyphens")
      .optional(),
    description: z.string().optional(),
    image_id: z.string().nullable().optional(),
    is_active: z.boolean().optional().default(true),
    display_order: z.number().optional().default(0),
    rank: z.number().optional(),
    parent_category_id: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()

export type AdminCreateCategoryType = z.infer<typeof AdminCreateCategory>

export const AdminUpdateCategory = z
  .object({
    name: z.string().min(1).optional(),
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/i)
      .optional(),
    description: z.string().optional(),
    image_id: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    display_order: z.number().optional(),
    rank: z.number().optional(),
    parent_category_id: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()

export type AdminUpdateCategoryType = z.infer<typeof AdminUpdateCategory>
