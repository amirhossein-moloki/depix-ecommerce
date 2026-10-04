import { createFindParams, createSelectParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"

export type AdminGetProductVideosParamsType = z.infer<typeof AdminGetProductVideosParams>
export const AdminGetProductVideosParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
  provider: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
})

export type AdminGetProductVideoParamsType = z.infer<typeof AdminGetProductVideoParams>
export const AdminGetProductVideoParams = createSelectParams()

export type AdminCreateProductVideoType = z.infer<typeof AdminCreateProductVideo>
export const AdminCreateProductVideo = z.object({
  product_id: z.string({ required_error: "product_id is required" }),
  variant_id: z.string().nullable().optional(),
  provider: z.string().optional(),
  video_url: z.string({ required_error: "video_url is required" }),
  video_id: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type AdminUpdateProductVideoType = z.infer<typeof AdminUpdateProductVideo>
export const AdminUpdateProductVideo = z.object({
  product_id: z.string().optional(),
  variant_id: z.string().nullable().optional(),
  provider: z.string().optional(),
  video_url: z.string().optional(),
  video_id: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type AdminReorderProductVideosType = z.infer<typeof AdminReorderProductVideos>
export const AdminReorderProductVideos = z.object({
  product_id: z.string({ required_error: "product_id is required" }),
  video_ids: z.array(z.string()).min(1, "video_ids array cannot be empty"),
})
