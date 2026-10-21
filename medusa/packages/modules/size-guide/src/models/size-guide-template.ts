import { model } from "@medusajs/framework/utils"

export interface SizeGuideColumn {
  id: string
  label: string
  key?: string
  order?: number
}

export interface SizeGuideRow {
  id: string
  cells: Record<string, string>
  order?: number
}

export const SizeGuideTemplate = model
  .define("SizeGuideTemplate", {
    id: model.id({ prefix: "sgtmpl" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    columns: model.json().default([] as any),
    rows: model.json().default([] as any),
    notes: model.text().nullable(),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_size_guide_template_is_active",
      on: ["is_active"],
    },
    {
      name: "IDX_size_guide_template_name",
      on: ["name"],
    },
  ])

export default SizeGuideTemplate
