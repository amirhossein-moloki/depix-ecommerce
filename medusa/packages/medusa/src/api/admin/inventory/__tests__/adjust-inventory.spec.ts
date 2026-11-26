import { POST as adjustInventory } from "../adjust/route"
import { MedusaError } from "@medusajs/framework/utils"

describe("POST /admin/inventory/adjust", () => {
  let mockRemoteQuery: jest.Mock
  let mockInventoryService: any
  let mockLink: any
  let req: any
  let res: any

  beforeEach(() => {
    mockRemoteQuery = jest.fn()
    mockInventoryService = {
      createInventoryItems: jest.fn(),
      createInventoryLevels: jest.fn(),
      updateInventoryLevels: jest.fn(),
      createInventoryTransaction: jest.fn(),
    }
    mockLink = {
      create: jest.fn(),
    }

    req = {
      body: {},
      auth_context: { actor_id: "usr_admin" },
      scope: {
        resolve: jest.fn((key) => {
          if (key === "remoteQuery") return mockRemoteQuery
          if (key === "inventory") return mockInventoryService
          if (key === "remoteLink") return mockLink
          return null
        }),
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  it("sets absolute quantity and records InventoryTransaction with custom reason", async () => {
    req.body = {
      product_id: "prod_1",
      variant_id: "variant_1",
      quantity: 15,
      delta: 1,
      reason: "افزایش سریع از پنل مدیریت",
    }

    mockRemoteQuery
      .mockResolvedValueOnce([
        {
          id: "variant_1",
          title: "Default",
          sku: "SKU-1",
          product_id: "prod_1",
          manage_inventory: true,
          inventory_items: [{ inventory_item_id: "iitem_1" }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "iitem_1",
          location_levels: [
            {
              id: "ilev_1",
              location_id: "loc_1",
              stocked_quantity: 14,
              reserved_quantity: 0,
              available_quantity: 14,
            },
          ],
        },
      ])

    mockInventoryService.createInventoryTransaction.mockResolvedValueOnce({
      id: "itrx_1",
      quantity_before: 14,
      quantity_change: 1,
      quantity_after: 15,
    })

    await adjustInventory(req, res)

    expect(mockInventoryService.updateInventoryLevels).toHaveBeenCalledWith([
      {
        inventory_item_id: "iitem_1",
        location_id: "loc_1",
        stocked_quantity: 15,
      },
    ])
    expect(mockInventoryService.createInventoryTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: "prod_1",
        variant_id: "variant_1",
        quantity_before: 14,
        quantity_change: 1,
        quantity_after: 15,
        type: "increase",
        reason: "افزایش سریع از پنل مدیریت",
      })
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        quantity_before: 14,
        quantity_change: 1,
        quantity_after: 15,
        inventory_quantity: 15,
      })
    )
  })

  it("adjusts stock by relative delta when quantity is omitted", async () => {
    req.body = {
      variant_id: "variant_1",
      delta: -2,
    }

    mockRemoteQuery
      .mockResolvedValueOnce([
        {
          id: "variant_1",
          product_id: "prod_1",
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

    mockInventoryService.createInventoryTransaction.mockResolvedValueOnce({
      id: "itrx_2",
    })

    await adjustInventory(req, res)

    expect(mockInventoryService.updateInventoryLevels).toHaveBeenCalledWith([
      {
        inventory_item_id: "iitem_1",
        location_id: "loc_1",
        stocked_quantity: 8,
      },
    ])
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity_before: 10,
        quantity_change: -2,
        quantity_after: 8,
        inventory_quantity: 8,
      })
    )
  })

  it("rejects adjustment that would result in negative inventory", async () => {
    req.body = {
      variant_id: "variant_1",
      delta: -5,
    }

    mockRemoteQuery
      .mockResolvedValueOnce([
        {
          id: "variant_1",
          product_id: "prod_1",
          inventory_items: [{ inventory_item_id: "iitem_1" }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "iitem_1",
          location_levels: [
            { id: "ilev_1", location_id: "loc_1", stocked_quantity: 3 },
          ],
        },
      ])

    await expect(adjustInventory(req, res)).rejects.toThrow(MedusaError)
    expect(mockInventoryService.updateInventoryLevels).not.toHaveBeenCalled()
  })
})
