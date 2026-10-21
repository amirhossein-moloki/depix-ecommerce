import { GET as getProductInventory } from "../route"
import { POST as adjustProductInventory } from "../adjustments/route"
import { GET as getProductInventoryHistory } from "../history/route"
import { GET as getLowStock } from "../../../../inventory/low-stock/route"
import { GET as getGlobalHistory } from "../../../../inventory/history/route"
import { MedusaError } from "@medusajs/framework/utils"

describe("Inventory Management and History API Routes", () => {
  let mockRemoteQuery: jest.Mock
  let mockInventoryService: any
  let req: any
  let res: any

  beforeEach(() => {
    mockRemoteQuery = jest.fn()
    mockInventoryService = {
      createInventoryLevels: jest.fn(),
      updateInventoryLevels: jest.fn(),
      createInventoryTransaction: jest.fn(),
    }

    req = {
      params: { id: "prod_123" },
      body: {},
      query: {},
      auth_context: { actor_id: "usr_admin" },
      scope: {
        resolve: jest.fn((key) => {
          if (key === "remoteQuery") return mockRemoteQuery
          if (key === "inventory") return mockInventoryService
          return null
        }),
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe("GET /admin/products/:id/inventory", () => {
    it("returns 404 when product is not found", async () => {
      mockRemoteQuery.mockResolvedValueOnce([])

      await expect(getProductInventory(req, res)).rejects.toThrow(
        MedusaError
      )
    })

    it("returns product variant inventory levels across locations", async () => {
      const mockProduct = {
        id: "prod_123",
        title: "Test Shirt",
        variants: [
          {
            id: "variant_456",
            title: "Large",
            sku: "SHIRT-L",
            inventory_items: [{ inventory_item_id: "iitem_789" }],
          },
        ],
      }

      const mockInventoryItems = [
        {
          id: "iitem_789",
          location_levels: [
            {
              id: "ilev_001",
              location_id: "loc_main",
              stocked_quantity: 50,
              reserved_quantity: 5,
              available_quantity: 45,
            },
          ],
        },
      ]

      mockRemoteQuery
        .mockResolvedValueOnce([mockProduct])
        .mockResolvedValueOnce(mockInventoryItems)

      await getProductInventory(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        product_id: "prod_123",
        title: "Test Shirt",
        variants: [
          {
            id: "variant_456",
            title: "Large",
            sku: "SHIRT-L",
            inventory_item_id: "iitem_789",
            stocked_quantity: 50,
            reserved_quantity: 5,
            available_quantity: 45,
            locations: [
              {
                id: "ilev_001",
                location_id: "loc_main",
                stocked_quantity: 50,
                reserved_quantity: 5,
                available_quantity: 45,
              },
            ],
          },
        ],
      })
    })
  })

  describe("POST /admin/products/:id/inventory/adjustments", () => {
    it("rejects invalid adjustment types", async () => {
      req.body = { type: "invalid_type", quantity: 10, reason: "purchase" }

      await expect(adjustProductInventory(req, res)).rejects.toThrow(
        "Invalid adjustment type"
      )
    })

    it("rejects non-positive quantities", async () => {
      req.body = { type: "increase", quantity: -5, reason: "purchase" }

      await expect(adjustProductInventory(req, res)).rejects.toThrow(
        "Quantity must be a positive integer"
      )
    })

    it("requires explanatory note for manual adjustments", async () => {
      req.body = {
        type: "increase",
        quantity: 10,
        reason: "manual_adjustment",
      }

      await expect(adjustProductInventory(req, res)).rejects.toThrow(
        "An explanatory note is required for manual stock adjustments"
      )
    })

    it("prevents stock adjustments resulting in negative inventory", async () => {
      req.body = {
        type: "decrease",
        quantity: 100,
        reason: "damaged",
        location_id: "loc_main",
      }

      const mockProduct = {
        id: "prod_123",
        variants: [
          {
            id: "variant_456",
            inventory_items: [{ inventory_item_id: "iitem_789" }],
          },
        ],
      }

      const mockInvItem = {
        id: "iitem_789",
        location_levels: [
          {
            id: "ilev_001",
            location_id: "loc_main",
            stocked_quantity: 10,
          },
        ],
      }

      mockRemoteQuery
        .mockResolvedValueOnce([mockProduct])
        .mockResolvedValueOnce([mockInvItem])

      await expect(adjustProductInventory(req, res)).rejects.toThrow(
        "Stock adjustment would result in negative inventory"
      )
    })

    it("successfully increases inventory and logs transaction record", async () => {
      req.body = {
        type: "increase",
        quantity: 20,
        reason: "purchase",
        note: "Received supplier stock",
        location_id: "loc_main",
      }

      const mockProduct = {
        id: "prod_123",
        variants: [
          {
            id: "variant_456",
            inventory_items: [{ inventory_item_id: "iitem_789" }],
          },
        ],
      }

      const mockInvItem = {
        id: "iitem_789",
        location_levels: [
          {
            id: "ilev_001",
            location_id: "loc_main",
            stocked_quantity: 10,
          },
        ],
      }

      const mockTransaction = {
        id: "itrx_001",
        quantity_before: 10,
        quantity_change: 20,
        quantity_after: 30,
        type: "increase",
        reason: "purchase",
      }

      mockRemoteQuery
        .mockResolvedValueOnce([mockProduct])
        .mockResolvedValueOnce([mockInvItem])

      mockInventoryService.createInventoryTransaction.mockResolvedValueOnce(
        mockTransaction
      )

      await adjustProductInventory(req, res)

      expect(mockInventoryService.updateInventoryLevels).toHaveBeenCalledWith([
        {
          inventory_item_id: "iitem_789",
          location_id: "loc_main",
          stocked_quantity: 30,
        },
      ])

      expect(
        mockInventoryService.createInventoryTransaction
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          inventory_item_id: "iitem_789",
          product_id: "prod_123",
          variant_id: "variant_456",
          location_id: "loc_main",
          quantity_before: 10,
          quantity_change: 20,
          quantity_after: 30,
          type: "increase",
          reason: "purchase",
          note: "Received supplier stock",
          created_by: "usr_admin",
        })
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          quantity_before: 10,
          quantity_change: 20,
          quantity_after: 30,
          transaction: mockTransaction,
        })
      )
    })
  })

  describe("GET /admin/inventory/low-stock", () => {
    it("returns products/variants at or below configured stock threshold", async () => {
      req.query = { threshold: "10" }

      const mockProducts = [
        {
          id: "prod_1",
          title: "Product Low Stock",
          variants: [
            {
              id: "var_1",
              title: "Default Variant",
              sku: "SKU-LOW",
              inventory_items: [{ inventory_item_id: "iitem_1" }],
            },
          ],
        },
      ]

      const mockInventoryItems = [
        {
          id: "iitem_1",
          location_levels: [
            {
              location_id: "loc_1",
              stocked_quantity: 5,
              reserved_quantity: 1,
              available_quantity: 4,
            },
          ],
        },
      ]

      mockRemoteQuery
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce(mockInventoryItems)

      await getLowStock(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          threshold: 10,
          low_stock_items: [
            expect.objectContaining({
              product_id: "prod_1",
              variant_id: "var_1",
              available_quantity: 4,
              status: "low_stock",
            }),
          ],
        })
      )
    })
  })

  describe("GET /admin/inventory/history", () => {
    it("returns paginated inventory transaction log with applied filters", async () => {
      req.query = {
        product_id: "prod_123",
        reason: "purchase",
        limit: "10",
        offset: "0",
      }

      const mockHistoryRows = [
        {
          id: "itrx_1",
          product_id: "prod_123",
          quantity_before: 0,
          quantity_change: 10,
          quantity_after: 10,
          type: "increase",
          reason: "purchase",
        },
      ]

      mockRemoteQuery.mockResolvedValueOnce({
        rows: mockHistoryRows,
        metadata: { count: 1, skip: 0, take: 10 },
      })

      await getGlobalHistory(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        history: mockHistoryRows,
        count: 1,
        offset: 0,
        limit: 10,
      })
    })
  })
})
