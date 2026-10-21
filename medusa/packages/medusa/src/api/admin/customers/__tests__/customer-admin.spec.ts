import {
  GET as getCustomersHandler,
} from "../route"
import {
  GET as getCustomerHandler,
} from "../[id]/route"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { defaultAdminCustomerFields } from "../query-config"

describe("Admin Customer Management", () => {
  let mockContainer: any
  let mockRemoteQuery: jest.Mock

  beforeEach(() => {
    mockRemoteQuery = jest.fn()

    mockContainer = {
      resolve: jest.fn().mockImplementation((key) => {
        if (key === ContainerRegistrationKeys.REMOTE_QUERY) {
          return mockRemoteQuery
        }
        return {}
      }),
    }
  })

  describe("GET /admin/customers (Paginated List, Search & Filter)", () => {
    it("returns a paginated list of customers", async () => {
      const mockCustomers = [
        {
          id: "cus_1",
          email: "customer1@example.com",
          first_name: "Ali",
          last_name: "Ahmadi",
          has_account: true,
          created_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "cus_2",
          email: "customer2@example.com",
          first_name: "Sara",
          last_name: "Mohammadi",
          has_account: false,
          created_at: "2026-01-02T00:00:00.000Z",
        },
      ]

      mockRemoteQuery.mockResolvedValueOnce({
        rows: mockCustomers,
        metadata: { count: 2, skip: 0, take: 50 },
      })

      const req: any = {
        scope: mockContainer,
        filterableFields: {},
        queryConfig: { pagination: { skip: 0, take: 50 }, fields: defaultAdminCustomerFields },
      }

      const res: any = {
        json: jest.fn(),
      }

      await getCustomersHandler(req, res)

      expect(mockRemoteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          __value: expect.objectContaining({
            customers: expect.objectContaining({
              __args: expect.objectContaining({
                take: 50,
                skip: 0,
              }),
            }),
          }),
        })
      )

      expect(res.json).toHaveBeenCalledWith({
        customers: mockCustomers,
        count: 2,
        offset: 0,
        limit: 50,
      })
    })

    it("applies search query and attribute filters", async () => {
      const mockFilteredCustomers = [
        {
          id: "cus_1",
          email: "ali@example.com",
          first_name: "Ali",
          last_name: "Ahmadi",
          has_account: true,
        },
      ]

      mockRemoteQuery.mockResolvedValueOnce({
        rows: mockFilteredCustomers,
        metadata: { count: 1, skip: 0, take: 50 },
      })

      const req: any = {
        scope: mockContainer,
        filterableFields: { q: "Ali", has_account: true },
        queryConfig: { pagination: { skip: 0, take: 50 }, fields: defaultAdminCustomerFields },
      }

      const res: any = {
        json: jest.fn(),
      }

      await getCustomersHandler(req, res)

      expect(mockRemoteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          __value: expect.objectContaining({
            customers: expect.objectContaining({
              __args: expect.objectContaining({
                filters: expect.objectContaining({ q: "Ali", has_account: true }),
              }),
            }),
          }),
        })
      )

      expect(res.json).toHaveBeenCalledWith({
        customers: mockFilteredCustomers,
        count: 1,
        offset: 0,
        limit: 50,
      })
    })
  })

  describe("GET /admin/customers/:id (Customer Details)", () => {
    it("returns details of an individual customer with requested fields and relations", async () => {
      const mockCustomer = {
        id: "cus_1",
        email: "ali@example.com",
        first_name: "Ali",
        last_name: "Ahmadi",
        has_account: true,
        addresses: [
          {
            id: "addr_1",
            address_1: "Freedom St 12",
            city: "Tehran",
          },
        ],
        orders: [
          {
            id: "order_1",
            display_id: 1001,
            total: 1500000,
          },
        ],
      }

      mockRemoteQuery.mockResolvedValueOnce([mockCustomer])

      const req: any = {
        params: { id: "cus_1" },
        scope: mockContainer,
        queryConfig: {
          fields: [...defaultAdminCustomerFields, "addresses.*", "orders.*"],
        },
      }

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await getCustomerHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ customer: mockCustomer })
    })

    it("throws 404 NOT_FOUND if customer is not found", async () => {
      mockRemoteQuery.mockResolvedValueOnce([])

      const req: any = {
        params: { id: "cus_nonexistent" },
        scope: mockContainer,
        queryConfig: { fields: defaultAdminCustomerFields },
      }

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await expect(getCustomerHandler(req, res)).rejects.toThrow(
        expect.objectContaining({
          type: MedusaError.Types.NOT_FOUND,
          message: "Customer with id: cus_nonexistent not found",
        })
      )
    })
  })

  describe("Admin Customer Data Protection", () => {
    it("excludes passwords, authentication tokens, and secrets from default customer query fields", () => {
      expect(defaultAdminCustomerFields).not.toContain("password")
      expect(defaultAdminCustomerFields).not.toContain("password_hash")
      expect(defaultAdminCustomerFields).not.toContain("token")
      expect(defaultAdminCustomerFields).not.toContain("secret")
    })
  })
})
