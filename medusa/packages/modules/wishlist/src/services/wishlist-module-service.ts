import { MedusaService } from "@medusajs/framework/utils"
import { Wishlist, WishlistItem } from "../models"

export default class WishlistModuleService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {}
