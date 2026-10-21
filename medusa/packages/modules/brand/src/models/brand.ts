import { model } from "@medusajs/framework/utils"

const Brand = model
  .define("Brand", {
    id: model.id({ prefix: "brand" }).primaryKey(),
    name: model.text().searchable(),
    slug: model.text().searchable(),
    description: model.text().nullable(),
    logo_id: model.text().nullable(),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_brand_slug_unique",
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_brand_is_active",
      on: ["is_active"],
    },
  ])

export default Brand
