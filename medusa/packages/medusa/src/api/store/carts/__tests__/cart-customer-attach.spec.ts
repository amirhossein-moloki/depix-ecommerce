import {
  transferCartCustomerWorkflowId,
  updateCartWorkflowId,
} from "@medusajs/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { POST as updateCart } from "../[id]/route"
import { attachAuthenticatedCustomerToCart } from "../helpers"
import { defaultStoreCartFields } from "../query-config"

describe("Guest Cart Auto-Attachment to Authenticated Customer", () => {
  const makeRes = () => {
    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })
    return { res: { json, status } as any, json, status }
  }

  it("includes customer_id in defaultStoreCartFields", () => {
    expect(defaultStoreCartFields).toContain("customer_id")
  })

  it("auto-attaches guest cart to authenticated customer on POST /store/carts/:id", async () => {
    const cart: any = {
      id: "cart_guest_1",
      customer_id: null,
      email: null,
      completed_at: null,
      metadata: {},
    }

    const cartService = {
      retrieveCart: jest.fn().mockImplementation(() => Promise.resolve({ ...cart })),
      updateCarts: jest.fn().mockImplementation((_id: string, data: any) => {
        Object.assign(cart, data)
        return Promise.resolve(cart)
      }),
    }
    const customerService = {
      retrieveCustomer: jest.fn().mockResolvedValue({
        id: "cus_1",
        email: "ali@example.com",
      }),
    }
    const we = {
      run: jest.fn().mockImplementation((wfId: string, opts: any) => {
        if (wfId === transferCartCustomerWorkflowId) {
          cart.customer_id = opts.input.customer_id
          cart.email = "ali@example.com"
          return Promise.resolve({})
        }
        if (wfId === updateCartWorkflowId) {
          if (opts.input.shipping_address) {
            cart.shipping_address = opts.input.shipping_address
          }
          if (opts.input.metadata) {
            cart.metadata = { ...(cart.metadata || {}), ...opts.input.metadata }
          }
          return Promise.resolve({})
        }
        throw new Error(`Unexpected workflow ${wfId}`)
      }),
    }
    const remoteQuery = jest.fn().mockImplementation(() => Promise.resolve([{ ...cart }]))

    const scope = {
      resolve: jest.fn((key: string) => {
        if (key === Modules.CART) return cartService
        if (key === Modules.CUSTOMER) return customerService
        if (key === Modules.WORKFLOW_ENGINE) return we
        if (key === ContainerRegistrationKeys.REMOTE_QUERY) return remoteQuery
        throw new Error(`Unexpected ${key}`)
      }),
    } as any

    const { res, status, json } = makeRes()
    await updateCart(
      {
        params: { id: "cart_guest_1" },
        auth_context: { actor_id: "cus_1" },
        validatedBody: {
          phone: "09123456789",
          shipping_address: {
            first_name: "علی",
            last_name: "رضایی",
            phone: "09123456789",
            address_1: "تهران",
            city: "تهران",
            country_code: "ir",
            postal_code: "1234567890",
          },
        },
        queryConfig: { fields: defaultStoreCartFields },
        scope,
      } as any,
      res
    )

    expect(status).toHaveBeenCalledWith(200)
    expect(we.run).toHaveBeenNthCalledWith(1, transferCartCustomerWorkflowId, {
      input: { id: "cart_guest_1", customer_id: "cus_1" },
    })
    expect(json.mock.calls[0][0].cart).toMatchObject({
      id: "cart_guest_1",
      customer_id: "cus_1",
      email: "ali@example.com",
    })
  })

  it("preserves prior guest email when phone-only customer has email: null", async () => {
    const cart: any = {
      id: "cart_guest_phone",
      customer_id: null,
      email: "guest@example.com",
      completed_at: null,
    }

    const cartService = {
      retrieveCart: jest.fn().mockImplementation(() => Promise.resolve({ ...cart })),
      updateCarts: jest.fn().mockImplementation((_id: string, data: any) => {
        Object.assign(cart, data)
        return Promise.resolve(cart)
      }),
    }
    const customerService = {
      retrieveCustomer: jest.fn().mockResolvedValue({
        id: "cus_phone_only",
        email: null,
      }),
    }
    const we = {
      run: jest.fn().mockImplementation((wfId: string, opts: any) => {
        if (wfId === transferCartCustomerWorkflowId) {
          cart.customer_id = opts.input.customer_id
          cart.email = null
          return Promise.resolve({})
        }
        return Promise.resolve({})
      }),
    }

    const scope = {
      resolve: jest.fn((key: string) => {
        if (key === Modules.CART) return cartService
        if (key === Modules.CUSTOMER) return customerService
        if (key === Modules.WORKFLOW_ENGINE) return we
        throw new Error(`Unexpected ${key}`)
      }),
    } as any

    const attached = await attachAuthenticatedCustomerToCart(
      scope,
      "cart_guest_phone",
      "cus_phone_only"
    )

    expect(attached).toBe(true)
    expect(cart.customer_id).toBe("cus_phone_only")
    expect(cart.email).toBe("guest@example.com")
  })

  it("does not hijack a cart already owned by another customer", async () => {
    const cart = {
      id: "cart_owned",
      customer_id: "cus_other",
      completed_at: null,
    }
    const cartService = {
      retrieveCart: jest.fn().mockResolvedValue(cart),
      updateCarts: jest.fn(),
    }
    const we = { run: jest.fn() }

    const scope = {
      resolve: jest.fn((key: string) => {
        if (key === Modules.CART) return cartService
        if (key === Modules.WORKFLOW_ENGINE) return we
        throw new Error(`Unexpected ${key}`)
      }),
    } as any

    const attached = await attachAuthenticatedCustomerToCart(
      scope,
      "cart_owned",
      "cus_intruder"
    )

    expect(attached).toBe(false)
    expect(we.run).not.toHaveBeenCalled()
    expect(cartService.updateCarts).not.toHaveBeenCalled()
  })
})
