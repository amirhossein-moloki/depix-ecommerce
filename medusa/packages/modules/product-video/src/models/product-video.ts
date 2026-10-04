import { model } from "@medusajs/framework/utils"

export const ProductVideoProvider = {
  YOUTUBE: "youtube",
  VIMEO: "vimeo",
  APARAT: "aparat",
  MP4: "mp4",
  EXTERNAL: "external",
  SELF_HOSTED: "self_hosted",
} as const

export type ProductVideoProviderType =
  (typeof ProductVideoProvider)[keyof typeof ProductVideoProvider]

export const ProductVideoStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type ProductVideoStatusType =
  (typeof ProductVideoStatus)[keyof typeof ProductVideoStatus]

const ProductVideo = model
  .define("ProductVideo", {
    id: model.id({ prefix: "pv" }).primaryKey(),
    product_id: model.text(),
    variant_id: model.text().nullable(),
    provider: model.text().default(ProductVideoProvider.EXTERNAL),
    video_url: model.text(),
    video_id: model.text().nullable(),
    title: model.text().nullable(),
    description: model.text().nullable(),
    thumbnail_url: model.text().nullable(),
    sort_order: model.number().default(0),
    status: model.text().default(ProductVideoStatus.ACTIVE),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["product_id"],
    },
    {
      on: ["variant_id"],
    },
    {
      on: ["product_id", "sort_order"],
    },
    {
      on: ["product_id", "status"],
    },
    {
      on: ["status"],
    },
    {
      on: ["provider"],
    },
    {
      on: ["created_at"],
    },
  ])

export default ProductVideo
