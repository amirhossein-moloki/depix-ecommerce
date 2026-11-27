import { model } from "@medusajs/framework/utils"

export enum BannerPlacement {
  HERO_MAIN = "hero_main",
  HERO_SECONDARY = "hero_secondary",
}

const Banner = model
  .define("Banner", {
    id: model.id({ prefix: "bnr" }).primaryKey(),
    title: model.text().nullable(),
    placement: model.enum(BannerPlacement).default(BannerPlacement.HERO_MAIN),
    image_url: model.text(),
    link_url: model.text().nullable(),
    sort_order: model.number().default(0),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_banner_placement_active_sort",
      on: ["placement", "is_active", "sort_order"],
      where: "deleted_at IS NULL",
    },
  ])

export default Banner
