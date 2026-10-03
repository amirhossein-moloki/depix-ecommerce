import { model } from "@medusajs/framework/utils"
import Wishlist from "./wishlist"

const WishlistItem = model
  .define("WishlistItem", {
    id: model.id({ prefix: "wli" }).primaryKey(),
    product_id: model.text(),
    variant_id: model.text().nullable(),
    wishlist: model.belongsTo(() => Wishlist, {
      mappedBy: "items",
    }),
  })
  .indexes([
    {
      on: ["product_id"],
    },
    {
      on: ["variant_id"],
    },
  ])

export default WishlistItem
