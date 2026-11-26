import { transferCartCustomerWorkflowId } from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

/**
 * Attaches an authenticated customer to a guest cart if the cart has not already been claimed or completed.
 */
export async function attachAuthenticatedCustomerToCart(
  scope: MedusaContainer,
  cartId: string,
  customerId?: string | null
): Promise<boolean> {
  if (!cartId || !customerId) {
    return false
  }

  let cartService: any = null
  try {
    cartService = scope.resolve<any>(Modules.CART)
  } catch {
    return false
  }

  const cart = await cartService?.retrieveCart?.(cartId).catch(() => null)
  if (!cart || cart.completed_at || cart.customer_id) {
    return false
  }

  let customer: any = null
  try {
    const customerService = scope.resolve<any>(Modules.CUSTOMER)
    customer = await customerService?.retrieveCustomer?.(customerId).catch(() => null)
  } catch {
    customer = null
  }

  const priorEmail = cart.email
  let attached = false

  try {
    const we = scope.resolve<any>(Modules.WORKFLOW_ENGINE)
    if (we?.run) {
      await we.run(transferCartCustomerWorkflowId, {
        input: {
          id: cartId,
          customer_id: customerId,
        },
      })
      attached = true
    }
  } catch {
    attached = false
  }

  if (!attached && cartService?.updateCarts) {
    await cartService.updateCarts(cartId, {
      customer_id: customerId,
      ...(customer?.email ? { email: customer.email } : {}),
    })
    attached = true
  }

  if (attached && priorEmail && !customer?.email && cartService?.updateCarts) {
    await cartService
      .updateCarts(cartId, { email: priorEmail })
      .catch(() => undefined)
  }

  return attached
}

export const refetchCart = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id } },
    fields,
  })

  const [cart] = await remoteQuery(queryObject)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${id}' not found`
    )
  }

  return cart
}
