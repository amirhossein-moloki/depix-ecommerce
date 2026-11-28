import { GET as getProductInventory } from "../../products/[id]/inventory/route"
import { POST as adjustProductInventory } from "../../products/[id]/inventory/adjustments/route"
import { GET as getProductInventoryHistory } from "../../products/[id]/inventory/history/route"
import { GET as getLowStock } from "../low-stock/route"
import { GET as getGlobalHistory } from "../history/route"
import { MedusaError, Modules } from "@medusajs/framework/utils"

describe("Inventory Management and History API Routes", () => {
  let mockRemoteQuery: jest.Mock
  let mockInventoryService: any
  let mockUserService: any
  let mockCustomerService: any
  let req: any
  let res: any

  beforeEach(() => {
    mockRemoteQuery = jest.fn()
    mockInventoryService = {
      createInventoryLevels: jest.fn(),
      updateInventoryLevels: jest.fn(),
      createInventoryTransaction: jest.fn(),
    }
    mockUserService = {
      listUsers: jest.fn().mockResolvedValue([]),
    }
    mockCustomerService = {
      listCustomers: jest.fn().mockResolvedValue([]),
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
          if (key === Modules.USER) return mockUserService
          if (key === Modules.CUSTOMER) return mockCustomerService
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
    it("returns paginated inventory transaction log enriched with product_title, variant_title, sku, and actor_name", async () => {
      req.query = {
        product_id: "prod_123",
        reason: "purchase",
        limit: "10",
        offset: "0",
      }

      const mockHistoryRows = [
        {
          id: "itrx_1",
          inventory_item_id: "iitem_1",
          product_id: "prod_123",
          variant_id: "var_1",
          quantity_before: 0,
          quantity_change: 10,
          quantity_after: 10,
          type: "increase",
          reason: "purchase",
          created_by: "usr_admin",
        },
      ]

      mockRemoteQuery
        .mockResolvedValueOnce({
          rows: mockHistoryRows,
          metadata: { count: 1, skip: 0, take: 10 },
        })
        .mockResolvedValueOnce([
          {
            id: "var_1",
            title: "مشکی",
            sku: "SKU-BLK-1",
            product_id: "prod_123",
            product: { id: "prod_123", title: "هدفون بی‌سیم" },
          },
        ])
      mockUserService.listUsers.mockResolvedValueOnce([
        {
          id: "usr_admin",
          first_name: "Ali",
          last_name: "Rezaei",
          metadata: { name: "مدیر انبار" },
        },
      ])

      await getGlobalHistory(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        history: [
          expect.objectContaining({
            id: "itrx_1",
            product_id: "prod_123",
            variant_id: "var_1",
            product_title: "هدفون بی‌سیم",
            variant_title: "مشکی",
            sku: "SKU-BLK-1",
            actor_name: "مدیر انبار",
          }),
        ],
        count: 1,
        offset: 0,
        limit: 10,
      })
    })

    it("enriches multiple transactions in batch across admin users, customers, system/admin sentinels, and deleted-variant inventory_item fallbacks", async () => {
      const mockHistoryRows = [
        {
          id: "itrx_admin_name",
          inventory_item_id: "iitem_1",
          product_id: "prod_1",
          variant_id: "var_1",
          quantity_change: 5,
          type: "increase",
          created_by: "usr_1",
        },
        {
          id: "itrx_admin_email",
          inventory_item_id: "iitem_1",
          product_id: "prod_1",
          variant_id: "var_1",
          quantity_change: 2,
          type: "increase",
          created_by: "usr_2",
        },
        {
          id: "itrx_customer",
          inventory_item_id: "iitem_1",
          product_id: "prod_1",
          variant_id: "var_1",
          quantity_change: -1,
          type: "decrease",
          created_by: "cus_1",
        },
        {
          id: "itrx_system",
          inventory_item_id: "iitem_deleted",
          product_id: "prod_deleted_var",
          variant_id: "var_deleted",
          quantity_change: -3,
          type: "decrease",
          created_by: "system",
        },
        {
          id: "itrx_admin_sentinel",
          inventory_item_id: "iitem_1",
          product_id: "prod_1",
          variant_id: "var_1",
          quantity_change: 4,
          type: "increase",
          created_by: "admin",
        },
      ]

      mockRemoteQuery
        .mockResolvedValueOnce({
          rows: mockHistoryRows,
          metadata: { count: 5, skip: 0, take: 20 },
        })
        // product_variant batch lookup (var_deleted omitted to simulate deleted variant)
        .mockResolvedValueOnce([
          {
            id: "var_1",
            title: "Large",
            sku: "SHIRT-L",
            product_id: "prod_1",
            product: { id: "prod_1", title: "Classic Tee" },
          },
        ])
        // product fallback lookup for prod_deleted_var
        .mockResolvedValueOnce([
          {
            id: "prod_deleted_var",
            title: "Archived Jacket",
          },
        ])
        // inventory_items fallback lookup for iitem_deleted
        .mockResolvedValueOnce([
          {
            id: "iitem_deleted",
            sku: "JKT-OLD-M",
            title: "Medium Jacket",
          },
        ])

      mockUserService.listUsers.mockResolvedValueOnce([
        {
          id: "usr_1",
          first_name: "Sara",
          last_name: "Mohammadi",
          email: "sara@example.com",
        },
        {
          id: "usr_2",
          email: "ops@example.com",
        },
      ])
      mockCustomerService.listCustomers.mockResolvedValueOnce([
        {
          id: "cus_1",
          first_name: "Reza",
          last_name: "Karimi",
        },
      ])

      await getGlobalHistory(req, res)

      expect(mockUserService.listUsers).toHaveBeenCalledTimes(1)
      expect(mockCustomerService.listCustomers).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(200)

      const payload = res.json.mock.calls[0][0]
      expect(payload.history).toEqual([
        expect.objectContaining({
          id: "itrx_admin_name",
          product_title: "Classic Tee",
          variant_title: "Large",
          sku: "SHIRT-L",
          actor_name: "Sara Mohammadi",
        }),
        expect.objectContaining({
          id: "itrx_admin_email",
          actor_name: "ops@example.com",
        }),
        expect.objectContaining({
          id: "itrx_customer",
          actor_name: "Reza Karimi",
        }),
        expect.objectContaining({
          id: "itrx_system",
          product_title: "Archived Jacket",
          variant_title: "Medium Jacket",
          sku: "JKT-OLD-M",
          actor_name: "System",
        }),
        expect.objectContaining({
          id: "itrx_admin_sentinel",
          actor_name: "Admin",
        }),
      ])
    })
  })

  describe("GET /admin/products/:id/inventory/history", () => {
    it("returns enriched product inventory history with product_title, variant_title, sku, and actor_name", async () => {
      req.params = { id: "prod_123" }
      req.query = {}

      mockRemoteQuery
        .mockResolvedValueOnce([{ id: "prod_123" }])
        .mockResolvedValueOnce({
          rows: [
            {
              id: "itrx_p1",
              inventory_item_id: "iitem_1",
              product_id: "prod_123",
              variant_id: "var_1",
              quantity_before: 10,
              quantity_change: -2,
              quantity_after: 8,
              type: "decrease",
              reason: "sale",
              created_by: "cus_buyer",
            },
          ],
          metadata: { count: 1, skip: 0, take: 20 },
        })
        .mockResolvedValueOnce([
          {
            id: "var_1",
            title: "آبی",
            sku: "BLUE-01",
            product_id: "prod_123",
            product: { id: "prod_123", title: "کوله‌پشتی" },
          },
        ])
      mockCustomerService.listCustomers.mockResolvedValueOnce([
        {
          id: "cus_buyer",
          first_name: "Nima",
          last_name: "Ahmadi",
        },
      ])

      await getProductInventoryHistory(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        history: [
          expect.objectContaining({
            id: "itrx_p1",
            product_title: "کوله‌پشتی",
            variant_title: "آبی",
            sku: "BLUE-01",
            actor_name: "Nima Ahmadi",
          }),
        ],
        count: 1,
        offset: 0,
        limit: 20,
      })
    })
  })
})
