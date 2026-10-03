import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to access wishlist"
    )
  }

  const wishlistService = req.scope.resolve<any>(Modules.WISHLIST)
  const productService = req.scope.resolve<any>(Modules.PRODUCT)

  const [wishlists] = await wishlistService.listAndCountWishlists(
    { customer_id: customerId },
    { relations: ["items"] }
  )

  let wishlist = wishlists[0]
  if (!wishlist) {
    wishlist = { id: null, customer_id: customerId, items: [] }
  } else if (wishlist.items?.length) {
    const productIds = Array.from(
      new Set(wishlist.items.map((i: any) => i.product_id))
    )

    const [products] = await productService.listAndCountProducts(
      { id: productIds },
      { relations: ["variants"] }
    )
    const productMap = new Map<string, any>(
      products.map((p: any) => [p.id, p])
    )

    wishlist.items = wishlist.items.map((item: any) => {
      const prod = productMap.get(item.product_id)
      const variant =
        item.variant_id && prod?.variants
          ? prod.variants.find((v: any) => v.id === item.variant_id)
          : null

      return {
        id: item.id,
        wishlist_id: item.wishlist_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: prod
          ? {
              id: prod.id,
              title: prod.title,
              handle: prod.handle,
              thumbnail: prod.thumbnail,
              status: prod.status,
            }
          : null,
        variant: variant
          ? {
              id: variant.id,
              title: variant.title,
              sku: variant.sku,
            }
          : null,
      }
    })
  }

  res.json({ wishlist })
}
