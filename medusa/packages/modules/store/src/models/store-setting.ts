import { model } from "@medusajs/framework/utils"

const StoreSetting = model.define("StoreSetting", {
  id: model.id({ prefix: "stset" }).primaryKey(),
  store_id: model.text().nullable(),
  store_name: model.text().default("Mepusham"),
  contact_phone: model.text().default(""),
  support_email: model.text().default(""),
  address: model.text().nullable(),
  tax_rate: model.number().default(0),
  enable_sms_notifications: model.boolean().default(true),
  enable_email_notifications: model.boolean().default(true),
  return_window_days: model.number().default(2),
  auto_approve_returns: model.boolean().default(false),
  default_shipping_address_id: model.text().nullable(),
  default_return_address_id: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default StoreSetting
