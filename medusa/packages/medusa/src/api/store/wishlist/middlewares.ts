import { validate } from "@medusajs/framework"
import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"
import { StoreCreateWishlistItem } from "./validators"

export const storeWishlistRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/wishlist",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/wishlist/items",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validate(StoreCreateWishlistItem),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/wishlist/items",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["DELETE"],
    matcher: "/store/wishlist/items/:id",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
]
