import { GET as getWishlist } from "../route"
import { POST as addWishlistItem, DELETE as clearWishlist } from "../items/route"
import { DELETE as removeWishlistItem } from "../items/[id]/route"
import { createWishlistItemWorkflow } from "../../../../../../core/core-flows/src/wishlist/workflows/create-wishlist-item"
import { removeWishlistItemWorkflow } from "../../../../../../core/core-flows/src/wishlist/workflows/remove-wishlist-item"
import { clearWishlistWorkflow } from "../../../../../../core/core-flows/src/wishlist/workflows/clear-wishlist"
import { createMedusaContainer, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"

describe("Store Wishlist API & Workflows", () => {
  describe("Wishlist Workflows", () => {
    it("should throw NOT_FOUND error if product does not exist", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockRejectedValue(new Error("Not found")),
      }
      const mockWishlistService = {
        listAndCountWishlists: jest.fn().mockResolvedValue([[], 0]),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.WISHLIST]: asValue(mockWishlistService),
      })

      const { errors } = await createWishlistItemWorkflow(container)
        .run({
          input: {
            customer_id: "cus_1",
            product_id: "prod_nonexistent",
          },
          container,
          throwOnError: true,
        })
        .catch((e) => ({ errors: [{ error: e }] }))

      expect(errors[0].error.message).toContain("Product with id prod_nonexistent not found")
    })

    it("should create wishlist and add item for customer", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1", title: "Test Product" }),
      }

      let createdItem: any = null
      const mockWishlistService = {
        listAndCountWishlists: jest.fn().mockResolvedValue([[], 0]),
        createWishlists: jest.fn().mockResolvedValue({ id: "wl_1", customer_id: "cus_1", items: [] }),
        createWishlistItems: jest.fn().mockImplementation((data) => {
          createdItem = { id: "wli_1", ...data }
          return Promise.resolve(createdItem)
        }),
      }

      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.WISHLIST]: asValue(mockWishlistService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createWishlistItemWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("wli_1")
      expect(result.product_id).toBe("prod_1")
    })

    it("should return existing item if duplicate product is added to wishlist", async () => {
      const mockProductService = {
        retrieveProduct: jest.fn().mockResolvedValue({ id: "prod_1", title: "Test Product" }),
      }

      const existingWishlistItem = {
        id: "wli_existing",
        wishlist_id: "wl_1",
        product_id: "prod_1",
        variant_id: null,
      }

      const mockWishlistService = {
        listAndCountWishlists: jest.fn().mockResolvedValue([
          [
            {
              id: "wl_1",
              customer_id: "cus_1",
              items: [existingWishlistItem],
            },
          ],
          1,
        ]),
        createWishlistItems: jest.fn(),
      }

      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const container = createMedusaContainer()
      container.register({
        [Modules.PRODUCT]: asValue(mockProductService),
        [Modules.WISHLIST]: asValue(mockWishlistService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const { result } = await createWishlistItemWorkflow(container).run({
        input: {
          customer_id: "cus_1",
          product_id: "prod_1",
        },
        container,
        throwOnError: true,
      })

      expect(result.id).toBe("wli_existing")
      expect(mockWishlistService.createWishlistItems).not.toHaveBeenCalled()
    })
  })

  describe("Store Wishlist API Routes", () => {
    it("should throw 401 if unauthenticated guest requests wishlist", async () => {
      const req: any = { auth_context: null }
      const res: any = {}

      await expect(getWishlist(req, res)).rejects.toThrow(
        "Authentication required to access wishlist"
      )
    })

    it("should return populated wishlist for authenticated customer", async () => {
      const mockWishlistService = {
        listAndCountWishlists: jest.fn().mockResolvedValue([
          [
            {
              id: "wl_1",
              customer_id: "cus_1",
              items: [
                {
                  id: "wli_1",
                  wishlist_id: "wl_1",
                  product_id: "prod_1",
                  variant_id: "var_1",
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                },
              ],
            },
          ],
          1,
        ]),
      }

      const mockProductService = {
        listAndCountProducts: jest.fn().mockResolvedValue([
          [
            {
              id: "prod_1",
              title: "Product 1",
              handle: "product-1",
              thumbnail: "thumb.jpg",
              status: "published",
              variants: [{ id: "var_1", title: "Red / L", sku: "SKU-1" }],
            },
          ],
          1,
        ]),
      }

      const req: any = {
        auth_context: { actor_id: "cus_1" },
        scope: {
          resolve: jest.fn((moduleName) => {
            if (moduleName === Modules.WISHLIST) return mockWishlistService
            if (moduleName === Modules.PRODUCT) return mockProductService
            return null
          }),
        },
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await getWishlist(req, res)

      expect(jsonMock).toHaveBeenCalledWith({
        wishlist: expect.objectContaining({
          customer_id: "cus_1",
          items: [
            expect.objectContaining({
              id: "wli_1",
              product_id: "prod_1",
              product: expect.objectContaining({ title: "Product 1" }),
              variant: expect.objectContaining({ title: "Red / L" }),
            }),
          ],
        }),
      })
    })

    it("should remove item from wishlist via DELETE /store/wishlist/items/:id", async () => {
      const mockWishlistService = {
        listAndCountWishlists: jest.fn().mockResolvedValue([
          [
            {
              id: "wl_1",
              customer_id: "cus_1",
              items: [{ id: "wli_1", wishlist_id: "wl_1", product_id: "prod_1" }],
            },
          ],
          1,
        ]),
        deleteWishlistItems: jest.fn().mockResolvedValue(undefined),
      }

      const mockEventBus = {
        emit: jest.fn().mockResolvedValue(undefined),
        releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      }

      const reqContainer = createMedusaContainer()
      reqContainer.register({
        [Modules.WISHLIST]: asValue(mockWishlistService),
        [Modules.EVENT_BUS]: asValue(mockEventBus),
      })

      const req: any = {
        params: { id: "wli_1" },
        auth_context: { actor_id: "cus_1" },
        scope: reqContainer,
      }

      const jsonMock = jest.fn()
      const res: any = { json: jsonMock }

      await removeWishlistItem(req, res)

      expect(mockWishlistService.deleteWishlistItems).toHaveBeenCalledWith(["wli_1"])
      expect(jsonMock).toHaveBeenCalledWith({
        id: "wli_1",
        object: "wishlist_item",
        deleted: true,
      })
    })
  })
})
