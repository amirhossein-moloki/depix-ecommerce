import { model } from "@medusajs/framework/utils"

const Media = model
  .define("Media", {
    id: model.id({ prefix: "media" }).primaryKey(),
    original_filename: model.text().searchable(),
    file_key: model.text().searchable(),
    mime_type: model.text(),
    file_size: model.number(),
    storage_provider: model.text().default("local"),
    url: model.text(),
    width: model.number().nullable(),
    height: model.number().nullable(),
    uploaded_by_id: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_media_file_key_unique",
      on: ["file_key"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_media_mime_type",
      on: ["mime_type"],
    },
    {
      name: "IDX_media_uploaded_by",
      on: ["uploaded_by_id"],
    },
  ])

export default Media
