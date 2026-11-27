import { Modules } from "@medusajs/framework/utils"
import { StoreSettingsService } from "../../../admin/settings/services/store-settings-service"
import { applyOrderStatusMetadata } from "../../../utils/order-status"
import { POST as completeStoreCart } from "../../carts/[id]/complete/route"
import { resolveOriginPostexCityCode } from "../../carts/[id]/shipping-methods/postex"
import { refetchCart } from "../../carts/helpers"
import { verifyGatewayPayment } from "../../payments/gateway"
import {
  deductInventoryForCompletedOrder,
  restoreInventoryForCanceledOrder,
} from "../../payments/inventory-deduction"
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
      updateStoreSettings: jest.fn().mockImplementation(async (data: any) => {
        if (!data || typeof data !== "object" || typeof data.id !== "string") {
          throw new TypeError(
            "MedusaService update expects an object/array with id, not positional (id, data)"
          )
        }
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
      {
        id: "prod_1",
        realPrice: 10000000,
        finalPrice: 10000000,
        discount: 0,
        variants: [
          {
            id: "var_1",
            calculated_price: {
              original_amount: 10000000,
              calculated_amount: 10000000,
            },
          },
        ],
      },
      { id: "prod_2", realPrice: 5000000, finalPrice: 5000000, discount: 0 },
    ]

    await applyActiveAutomaticPromotionsToProducts(scope, products)

    expect(products[0]).toEqual({
      id: "prod_1",
      realPrice: 10000000,
      finalPrice: 8000000,
      discount: 20,
      variants: [
        {
          id: "var_1",
          calculated_price: {
            original_amount: 10000000,
            calculated_amount: 8000000,
          },
        },
      ],
    })
    expect(products[1]).toEqual({
      id: "prod_2",
      realPrice: 5000000,
      finalPrice: 5000000,
      discount: 0,
    })
  })

  it("hydrates order financial_snapshot and promotions from metadata in applyOrderStatusMetadata", () => {
    const hydrated = applyOrderStatusMetadata({
      id: "ord_1",
      metadata: {
        promotions: [{ code: "ALL50", type: "percentage", value: 50 }],
        financial_snapshot: {
          subtotal: 1000000,
          discount_total: 500000,
          shipping_total: 0,
          tax_total: 0,
          total: 500000,
        },
      },
    })

    expect(hydrated.subtotal).toBe(1000000)
    expect(hydrated.discount_total).toBe(500000)
    expect(hydrated.total).toBe(500000)
    expect(hydrated.promotions).toEqual([
      { code: "ALL50", type: "percentage", value: 50 },
    ])
  })

  it("deducts inventory_quantity and records InventoryTransaction (type: decrease, reason: sale) idempotently on order completion", async () => {
    const mockInventoryService = {
      listInventoryTransactions: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "itrx_1" }]),
      deleteReservationItemsByLineItem: jest.fn().mockResolvedValue(undefined),
      adjustInventory: jest.fn().mockResolvedValue({ id: "ilev_1", stocked_quantity: 8 }),
      updateInventoryLevels: jest.fn().mockResolvedValue(undefined),
      createInventoryTransaction: jest.fn().mockResolvedValue({ id: "itrx_1" }),
    }
    const mockRemoteQuery = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "var_1",
          product_id: "prod_1",
          manage_inventory: true,
          inventory_items: [{ inventory_item_id: "iitem_1" }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "iitem_1",
          location_levels: [
            { id: "ilev_1", location_id: "loc_1", stocked_quantity: 10 },
          ],
        },
      ])

    const scope: any = {
      resolve: jest.fn((key) => {
        if (key === Modules.INVENTORY) return mockInventoryService
        if (key === "remoteQuery") return mockRemoteQuery
        return null
      }),
    }

    const cart = {
      id: "cart_1",
      customer_id: "cus_1",
      items: [{ id: "li_1", variant_id: "var_1", product_id: "prod_1", quantity: 2 }],
    }

    await deductInventoryForCompletedOrder(scope, "ord_1", cart)

    expect(
      mockInventoryService.deleteReservationItemsByLineItem
    ).toHaveBeenCalledWith("li_1")
    expect(mockInventoryService.adjustInventory).toHaveBeenCalledWith(
      "iitem_1",
      "loc_1",
      -2
    )
    expect(mockInventoryService.createInventoryTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "decrease",
        reason: "sale",
        reference_type: "order",
        reference_id: "ord_1",
        quantity_before: 10,
        quantity_change: -2,
        quantity_after: 8,
      })
    )

    // Second call is idempotent and does not double-deduct
    await deductInventoryForCompletedOrder(scope, "ord_1", cart)
    expect(mockInventoryService.adjustInventory).toHaveBeenCalledTimes(1)
  })

  it("restores stocked_quantity and logs InventoryTransaction (type: increase, reason: cancellation) idempotently", async () => {
    const mockInventoryService = {
      listInventoryTransactions: jest
        .fn()
        // First call: check existing cancellation tx -> none
        .mockResolvedValueOnce([])
        // Second call: fetch sale txs for ord_1
        .mockResolvedValueOnce([
          {
            id: "itrx_sale_1",
            inventory_item_id: "iitem_1",
            inventory_level_id: "ilev_1",
            product_id: "prod_1",
            variant_id: "var_1",
            location_id: "loc_1",
            quantity_change: -2,
            quantity_after: 8,
          },
        ])
        // Third call (idempotency re-run): cancellation tx already exists
        .mockResolvedValueOnce([{ id: "itrx_cancel_1" }]),
      adjustInventory: jest.fn().mockResolvedValue({ id: "ilev_1", stocked_quantity: 10 }),
      createInventoryTransaction: jest.fn().mockResolvedValue({ id: "itrx_cancel_1" }),
    }
    const mockRemoteQuery = jest.fn().mockResolvedValueOnce([
      {
        id: "iitem_1",
        location_levels: [
          { id: "ilev_1", location_id: "loc_1", stocked_quantity: 8 },
        ],
      },
    ])

    const scope: any = {
      resolve: jest.fn((key) => {
        if (key === Modules.INVENTORY) return mockInventoryService
        if (key === "remoteQuery") return mockRemoteQuery
        return null
      }),
    }

    await restoreInventoryForCanceledOrder(scope, "ord_1", "usr_admin")

    expect(mockInventoryService.adjustInventory).toHaveBeenCalledWith(
      "iitem_1",
      "loc_1",
      2
    )
    expect(mockInventoryService.createInventoryTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "increase",
        reason: "cancellation",
        reference_type: "order",
        reference_id: "ord_1",
        quantity_before: 8,
        quantity_change: 2,
        quantity_after: 10,
        created_by: "usr_admin",
      })
    )

    // Repeat call is idempotent
    await restoreInventoryForCanceledOrder(scope, "ord_1", "usr_admin")
    expect(mockInventoryService.adjustInventory).toHaveBeenCalledTimes(1)
  })

  it("triggers deductInventoryForCompletedOrder from POST /store/carts/:id/complete", async () => {
    const mockInventoryService = {
      listInventoryTransactions: jest.fn().mockResolvedValue([]),
      deleteReservationItemsByLineItem: jest.fn().mockResolvedValue(undefined),
      adjustInventory: jest.fn().mockResolvedValue({ id: "ilev_1", stocked_quantity: 9 }),
      createInventoryTransaction: jest.fn().mockResolvedValue({ id: "itrx_c1" }),
    }
    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue({
        id: "ord_complete_1",
        customer_id: "cus_1",
        items: [{ id: "oi_1", variant_id: "var_1", product_id: "prod_1", quantity: 1 }],
      }),
    }
    const mockWorkflowEngine = {
      run: jest.fn().mockResolvedValue({
        errors: [],
        result: { id: "ord_complete_1" },
        transaction: { hasFinished: () => true },
      }),
    }
    const mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [{ id: "ord_complete_1" }] }),
    }
    const mockRemoteQuery = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "var_1",
          product_id: "prod_1",
          manage_inventory: true,
          inventory_items: [{ inventory_item_id: "iitem_1" }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "iitem_1",
          location_levels: [{ id: "ilev_1", location_id: "loc_1", stocked_quantity: 10 }],
        },
      ])

    const req: any = {
      params: { id: "cart_c1" },
      queryConfig: { fields: ["id"] },
      scope: {
        resolve: jest.fn((key) => {
          if (key === Modules.WORKFLOW_ENGINE) return mockWorkflowEngine
          if (key === "query") return mockQuery
          if (key === Modules.ORDER) return mockOrderService
          if (key === Modules.INVENTORY) return mockInventoryService
          if (key === "remoteQuery") return mockRemoteQuery
          return null
        }),
      },
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await completeStoreCart(req, res)

    expect(mockInventoryService.adjustInventory).toHaveBeenCalledWith(
      "iitem_1",
      "loc_1",
      -1
    )
    expect(mockInventoryService.createInventoryTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "decrease",
        reason: "sale",
        reference_id: "ord_complete_1",
      })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("triggers deductInventoryForCompletedOrder in Zarinpal verifyGatewayPayment", async () => {
    const mockInventoryService = {
      listInventoryTransactions: jest.fn().mockResolvedValue([]),
      deleteReservationItemsByLineItem: jest.fn().mockResolvedValue(undefined),
      adjustInventory: jest.fn().mockResolvedValue({ id: "ilev_1", stocked_quantity: 7 }),
      createInventoryTransaction: jest.fn().mockResolvedValue({ id: "itrx_z1" }),
    }
    const cartObj = {
      id: "cart_zar_1",
      customer_id: "cus_1",
      total: 1000000,
      subtotal: 1000000,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 0,
      items: [{ id: "ci_1", variant_id: "var_1", product_id: "prod_1", quantity: 3, unit_price: 333333 }],
      metadata: {
        payment_session: {
          payment_id: "pay_1",
          authority: "A0001",
          provider: "zarinpal",
          amount_irr: 1000000,
        },
      },
    }
    const mockCartService = {
      retrieveCart: jest.fn().mockResolvedValue(cartObj),
      updateCarts: jest.fn(),
    }
    const mockOrderService = {
      retrieveOrder: jest.fn().mockResolvedValue({
        id: "ord_zar_1",
        customer_id: "cus_1",
        items: [{ id: "oi_1", variant_id: "var_1", product_id: "prod_1", quantity: 3 }],
      }),
      updateOrders: jest.fn(),
    }
    const mockWorkflowEngine = {
      run: jest.fn().mockResolvedValue({
        result: { id: "ord_zar_1", metadata: {} },
      }),
    }
    const mockRemoteQuery = jest
      .fn()
      // retrieveFullCartForPayment
      .mockResolvedValueOnce([cartObj])
      // product_variant lookup
      .mockResolvedValueOnce([
        {
          id: "var_1",
          product_id: "prod_1",
          manage_inventory: true,
          inventory_items: [{ inventory_item_id: "iitem_1" }],
        },
      ])
      // inventory_items lookup
      .mockResolvedValueOnce([
        {
          id: "iitem_1",
          location_levels: [{ id: "ilev_1", location_id: "loc_1", stocked_quantity: 10 }],
        },
      ])

    const scope: any = {
      resolve: jest.fn((key) => {
        if (key === Modules.CART) return mockCartService
        if (key === Modules.ORDER) return mockOrderService
        if (key === Modules.WORKFLOW_ENGINE) return mockWorkflowEngine
        if (key === Modules.INVENTORY) return mockInventoryService
        if (key === "remoteQuery") return mockRemoteQuery
        return null
      }),
    }

    const res = await verifyGatewayPayment(scope, {
      cartId: "cart_zar_1",
      authority: "A0001",
      status: "OK",
      provider: "zarinpal",
    })

    expect(res.verified).toBe(true)
    expect(mockInventoryService.adjustInventory).toHaveBeenCalledWith(
      "iitem_1",
      "loc_1",
      -3
    )
    expect(mockInventoryService.createInventoryTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "decrease",
        reason: "sale",
        reference_id: "ord_zar_1",
        quantity_before: 10,
        quantity_change: -3,
        quantity_after: 7,
      })
    )
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
