import { model } from "@medusajs/framework/utils"
import WishlistItem from "./wishlist-item"

const Wishlist = model
  .define("Wishlist", {
    id: model.id({ prefix: "wl" }).primaryKey(),
    customer_id: model.text(),
    items: model.hasMany(() => WishlistItem, {
      mappedBy: "wishlist",
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["customer_id"],
    },
  ])

export default Wishlist
