import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to view order products"
    )
  }

  const orderId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "items.id",
      "items.title",
      "items.product_id",
      "items.variant_id",
      "items.thumbnail",
      "items.quantity",
    ],
    filters: { id: orderId },
  })

  const order = orders && orders[0]
  if (!order || order.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id ${orderId} was not found`
    )
  }

  const productsMap = new Map<string, any>()
  for (const item of order.items || []) {
    if (item.product_id && !productsMap.has(item.product_id)) {
      productsMap.set(item.product_id, {
        product_id: item.product_id,
        title: item.title,
        thumbnail: item.thumbnail,
      })
    }
  }

  res.json({
    products: Array.from(productsMap.values()),
  })
}
