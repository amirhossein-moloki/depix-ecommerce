import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const SizeGuideColumnSchema = z.object({
  id: z.string().min(1, "Column ID is required"),
  label: z.string().min(1, "Column label is required"),
  key: z.string().optional(),
  order: z.number().optional(),
})

export const SizeGuideRowSchema = z.object({
  id: z.string().min(1, "Row ID is required"),
  cells: z.record(z.string()),
  order: z.number().optional(),
})

export const AdminGetSizeGuideTemplatesParams = createFindParams({
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

export type AdminGetSizeGuideTemplatesParamsType = z.infer<
  typeof AdminGetSizeGuideTemplatesParams
>

export const AdminCreateSizeGuideTemplate = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().nullable().optional(),
    columns: z.array(SizeGuideColumnSchema).min(1, "At least one column is required"),
    rows: z.array(SizeGuideRowSchema).default([]),
    notes: z.string().nullable().optional(),
    is_active: z.boolean().optional().default(true),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      const colIds = new Set(data.columns.map((c) => c.id))
      return colIds.size === data.columns.length
    },
    { message: "Column IDs must be unique" }
  )
  .refine(
    (data) => {
      const rowIds = new Set(data.rows.map((r) => r.id))
      return rowIds.size === data.rows.length
    },
    { message: "Row IDs must be unique" }
  )

export type AdminCreateSizeGuideTemplateType = z.infer<
  typeof AdminCreateSizeGuideTemplate
>

export const AdminUpdateSizeGuideTemplate = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    columns: z.array(SizeGuideColumnSchema).min(1).optional(),
    rows: z.array(SizeGuideRowSchema).optional(),
    notes: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (!data.columns) return true
      const colIds = new Set(data.columns.map((c) => c.id))
      return colIds.size === data.columns.length
    },
    { message: "Column IDs must be unique" }
  )
  .refine(
    (data) => {
      if (!data.rows) return true
      const rowIds = new Set(data.rows.map((r) => r.id))
      return rowIds.size === data.rows.length
    },
    { message: "Row IDs must be unique" }
  )

export type AdminUpdateSizeGuideTemplateType = z.infer<
  typeof AdminUpdateSizeGuideTemplate
>

export const AdminUpsertProductSizeGuide = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().nullable().optional(),
    columns: z.array(SizeGuideColumnSchema).optional(),
    rows: z.array(SizeGuideRowSchema).optional(),
    notes: z.string().nullable().optional(),
    source_template_id: z.string().nullable().optional(),
    image_id: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (!data.columns) return true
      const colIds = new Set(data.columns.map((c) => c.id))
      return colIds.size === data.columns.length
    },
    { message: "Column IDs must be unique" }
  )
  .refine(
    (data) => {
      if (!data.rows) return true
      const rowIds = new Set(data.rows.map((r) => r.id))
      return rowIds.size === data.rows.length
    },
    { message: "Row IDs must be unique" }
  )

export type AdminUpsertProductSizeGuideType = z.infer<
  typeof AdminUpsertProductSizeGuide
>
