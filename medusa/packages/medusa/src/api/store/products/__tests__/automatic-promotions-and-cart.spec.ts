import { Modules } from "@medusajs/framework/utils"
import { StoreSettingsService } from "../../../admin/settings/services/store-settings-service"
import { resolveOriginPostexCityCode } from "../../carts/[id]/shipping-methods/postex"
import { refetchCart } from "../../carts/helpers"
import { applyActiveAutomaticPromotionsToProducts } from "../helpers"

describe("StoreAddress postexCityCode, Product Automatic Promotions & Cart Promotions", () => {
  it("stores postexCityCode on StoreAddress and resolves it as Postex origin city code", async () => {
    const addressesDb: any[] = []
    let settingsRecord: any = {
      id: "set_1",
      default_shipping_address_id: null,
      default_return_address_id: null,
    }

    const mockStoreService = {
      listStoreSettings: jest.fn().mockImplementation(async () => [settingsRecord]),
      createStoreSettings: jest.fn(),
      updateStoreSettings: jest.fn().mockImplementation(async (_id, data) => {
        settingsRecord = { ...settingsRecord, ...data }
        return settingsRecord
      }),
      listStoreAddresses: jest.fn().mockImplementation(async () => addressesDb),
      createStoreAddresses: jest.fn().mockImplementation(async (items: any[]) => {
        const created = { id: "staddr_tbz", ...items[0] }
        addressesDb.push(created)
        return [created]
      }),
      retrieveStoreAddress: jest.fn().mockImplementation(async (id: string) =>
        addressesDb.find((a) => a.id === id)
      ),
      updateStoreAddresses: jest.fn(),
    }

    const scope: any = {
      resolve: jest.fn((key) =>
        key === Modules.STORE ? mockStoreService : null
      ),
    }

    const service = new StoreSettingsService(scope)
    const created = await service.createAddress({
      title: "انبار مرکزی تبریز",
      recipientName: "مدیر انبار",
      phone: "04133334444",
      province: "آذربایجان شرقی",
      city: "تبریز",
      address: "خیابان امام",
      postalCode: "5136812345",
      postexCityCode: 101,
      isDefaultShipping: true,
    })

    expect(created.postexCityCode).toBe(101)
    const originCode = await resolveOriginPostexCityCode(scope)
    expect(originCode).toBe(101)
  })

  it("applies active automatic promotions to product realPrice, finalPrice, and discount", async () => {
    const mockRemoteQuery = jest.fn().mockResolvedValue([
      {
        id: "promo_auto_1",
        code: "SUMMER20",
        status: "active",
        is_automatic: true,
        metadata: {},
        application_method: {
          type: "percentage",
          value: 20,
          target_type: "items",
          target_rules: [
            {
              attribute: "items.product.id",
              operator: "in",
              values: [{ value: "prod_1" }],
            },
          ],
        },
      },
    ])

    const scope: any = {
      resolve: jest.fn((key) =>
        key === "remoteQuery" ? mockRemoteQuery : null
      ),
    }

    const products = [
      { id: "prod_1", realPrice: 10000000, finalPrice: 10000000, discount: 0 },
      { id: "prod_2", realPrice: 5000000, finalPrice: 5000000, discount: 0 },
    ]

    await applyActiveAutomaticPromotionsToProducts(scope, products)

    expect(products[0]).toEqual({
      id: "prod_1",
      realPrice: 10000000,
      finalPrice: 8000000,
      discount: 20,
    })
    expect(products[1]).toEqual({
      id: "prod_2",
      realPrice: 5000000,
      finalPrice: 5000000,
      discount: 0,
    })
  })

  it("enriches cart.promotions with top-level type and value in refetchCart", async () => {
    const mockRemoteQuery = jest.fn().mockResolvedValue([
      {
        id: "cart_1",
        discount_total: 7199000,
        promotions: [
          {
            id: "promo_1",
            code: "SUMMER20",
            is_automatic: false,
            application_method: {
              type: "percentage",
              value: 20,
              currency_code: null,
            },
          },
        ],
      },
    ])

    const scope: any = {
      resolve: jest.fn((key) =>
        key === "remoteQuery" ? mockRemoteQuery : null
      ),
    }

    const cart = await refetchCart("cart_1", scope, ["id", "promotions.*"])

    expect(cart.promotions).toEqual([
      expect.objectContaining({
        code: "SUMMER20",
        type: "percentage",
        value: 20,
        application_method: {
          type: "percentage",
          value: 20,
          currency_code: null,
        },
      }),
    ])
  })
})
