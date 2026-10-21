import { model } from "@medusajs/framework/utils"

const StoreAddress = model.define("StoreAddress", {
  id: model.id({ prefix: "staddr" }).primaryKey(),
  store_id: model.text().nullable(),
  title: model.text(),
  recipient_name: model.text(),
  phone: model.text(),
  province: model.text(),
  city: model.text(),
  address: model.text(),
  plaque: model.text().nullable(),
  floor: model.text().nullable(),
  postal_code: model.text(),
  metadata: model.json().nullable(),
})

export default StoreAddress
