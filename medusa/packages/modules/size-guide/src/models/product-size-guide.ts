import { model } from "@medusajs/framework/utils"

export const ProductSizeGuide = model
  .define("ProductSizeGuide", {
    id: model.id({ prefix: "psguide" }).primaryKey(),
    product_id: model.text(),
    title: model.text(),
    description: model.text().nullable(),
    columns: model.json().default([] as any),
    rows: model.json().default([] as any),
    notes: model.text().nullable(),
    source_template_id: model.text().nullable(),
    image_id: model.text().nullable(),
    image_url: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_product_size_guide_product_id_unique",
      on: ["product_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_size_guide_source_template_id",
      on: ["source_template_id"],
    },
  ])

export default ProductSizeGuide
