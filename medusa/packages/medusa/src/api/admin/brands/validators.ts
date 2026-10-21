import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const AdminGetBrandsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
    is_active: z
      .union([z.boolean(), z.string().transform((v) => v === "true")])
      .optional(),
  })
)

export type AdminGetBrandsParamsType = z.infer<typeof AdminGetBrandsParams>

export const AdminCreateBrand = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(
        /^[a-z0-9-]+$/i,
        "Slug must contain only alphanumeric characters and hyphens"
      ),
    description: z.string().nullable().optional(),
    logo_id: z.string().nullable().optional(),
    is_active: z.boolean().optional().default(true),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()

export type AdminCreateBrandType = z.infer<typeof AdminCreateBrand>

export const AdminUpdateBrand = z
  .object({
    name: z.string().min(1).optional(),
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/i)
      .optional(),
    description: z.string().nullable().optional(),
    logo_id: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()

export type AdminUpdateBrandType = z.infer<typeof AdminUpdateBrand>
