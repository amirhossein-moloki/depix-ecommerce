import { model } from "@medusajs/framework/utils"

const RecommendationModel = model.define("RecommendationModel", {
  id: model.id({ prefix: "recmod_" }).primaryKey(),
  version: model.text().searchable(),
  algorithm: model.text().default("implicit-collaborative-filtering"),
  status: model.text().default("TRAINING"), // TRAINING, VALIDATING, READY, ACTIVE, ARCHIVED, FAILED
  is_active: model.boolean().default(false),
  training_timestamp: model.text().nullable(),
  data_range_start: model.text().nullable(),
  data_range_end: model.text().nullable(),
  metrics: model.json().nullable(),
  parameters: model.json().nullable(),
  artifact_data: model.json().nullable(),
  metadata: model.json().nullable(),
})

export default RecommendationModel
