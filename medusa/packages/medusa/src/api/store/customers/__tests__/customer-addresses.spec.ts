import {
  GET as getAddressesHandler,
  POST as createAddressHandler,
} from "../me/addresses/route"
import {
  GET as getAddressHandler,
  POST as updateAddressHandler,
  DELETE as deleteAddressHandler,
} from "../me/addresses/[address_id]/route"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { StoreCreateCustomerAddress } from "../validators"

describe("Store Customer Address Management", () => {
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

  describe("GET /store/customers/me/addresses", () => {
    it("retrieves addresses belonging to the authenticated customer", async () => {
      const mockAddresses = [
        {
          id: "addr_1",
          customer_id: "cus_123",
          first_name: "Ali",
          last_name: "Rezaei",
          address_1: "Freedom Ave",
          city: "Tehran",
          country_code: "ir",
          postal_code: "1234567890",
          is_default_shipping: true,
        },
      ]

      mockRemoteQuery.mockResolvedValueOnce({
        rows: mockAddresses,
        metadata: { count: 1, skip: 0, take: 50 },
      })

      const req: any = {
        auth_context: { actor_id: "cus_123" },
        scope: mockContainer,
        filterableFields: {},
        queryConfig: { pagination: { skip: 0, take: 50 }, fields: ["id", "address_1"] },
      }

      const res: any = {
        json: jest.fn(),
      }

      await getAddressesHandler(req, res)

      expect(mockRemoteQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          __value: expect.objectContaining({
            customer_address: expect.objectContaining({
              __args: expect.objectContaining({
                filters: expect.objectContaining({ customer_id: "cus_123" }),
              }),
            }),
          }),
        })
      )

      expect(res.json).toHaveBeenCalledWith({
        addresses: mockAddresses,
        count: 1,
        offset: 0,
        limit: 50,
      })
    })
  })

  describe("GET /store/customers/me/addresses/:address_id", () => {
    it("returns address if owned by the authenticated customer", async () => {
      const mockAddress = {
        id: "addr_1",
        customer_id: "cus_123",
        address_1: "Street 1",
      }

      mockRemoteQuery.mockResolvedValueOnce([mockAddress])

      const req: any = {
        auth_context: { actor_id: "cus_123" },
        params: { address_id: "addr_1" },
        scope: mockContainer,
        queryConfig: { fields: ["id", "address_1"] },
      }

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await getAddressHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ address: mockAddress })
    })

    it("throws 404 NOT_FOUND if address is not found or belongs to another customer (IDOR protection)", async () => {
      mockRemoteQuery.mockResolvedValueOnce([])

      const req: any = {
        auth_context: { actor_id: "cus_123" },
        params: { address_id: "addr_other_user" },
        scope: mockContainer,
        queryConfig: { fields: ["id"] },
      }

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await expect(getAddressHandler(req, res)).rejects.toThrow(
        expect.objectContaining({
          type: MedusaError.Types.NOT_FOUND,
          message: "Address with id: addr_other_user was not found",
        })
      )
    })
  })

  describe("Address Validation Rules (Iranian Addresses & Input Constraints)", () => {
    it("accepts a valid Iranian address payload", () => {
      const validAddress = {
        first_name: "علی",
        last_name: "رضایی",
        phone: "09123456789",
        address_1: "خیابان آزادی، پلاک ۱۰",
        city: "تهران",
        province: "تهران",
        country_code: "ir",
        postal_code: "1234567890",
        metadata: {
          national_code: "0010532080",
        },
      }

      const parseResult = StoreCreateCustomerAddress.safeParse(validAddress)
      expect(parseResult.success).toBe(true)
    })

    it("rejects an Iranian address with an invalid postal code", () => {
      const invalidAddress = {
        phone: "09123456789",
        country_code: "ir",
        postal_code: "12345", // must be exactly 10 digits
        metadata: { national_code: "0010532080" },
      }

      const parseResult = StoreCreateCustomerAddress.safeParse(invalidAddress)
      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        expect(parseResult.error.issues[0].message).toContain("10 digits")
      }
    })

    it("rejects an Iranian address with an invalid mobile number", () => {
      const invalidAddress = {
        phone: "123456", // invalid mobile number
        country_code: "ir",
        postal_code: "1234567890",
        metadata: { national_code: "0010532080" },
      }

      const parseResult = StoreCreateCustomerAddress.safeParse(invalidAddress)
      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        expect(parseResult.error.issues[0].message).toContain("mobile number")
      }
    })

    it("rejects an Iranian address with missing or invalid national_code in metadata", () => {
      const invalidAddress = {
        phone: "09123456789",
        country_code: "ir",
        postal_code: "1234567890",
        metadata: { national_code: "1111111111" }, // invalid checksum
      }

      const parseResult = StoreCreateCustomerAddress.safeParse(invalidAddress)
      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        expect(parseResult.error.issues[0].message).toContain("national_code")
      }
    })

    it("accepts an international address without Iranian metadata constraints", () => {
      const internationalAddress = {
        first_name: "John",
        last_name: "Doe",
        phone: "+15551234567",
        address_1: "123 Elm Street",
        city: "Los Angeles",
        province: "CA",
        country_code: "us",
        postal_code: "90210",
      }

      const parseResult = StoreCreateCustomerAddress.safeParse(internationalAddress)
      expect(parseResult.success).toBe(true)
    })
  })

  describe("POST /store/customers/me/addresses/:address_id (Update Address IDOR Protection)", () => {
    it("prevents updating an address belonging to another customer", async () => {
      mockRemoteQuery.mockResolvedValueOnce([])

      const req: any = {
        auth_context: { actor_id: "cus_123" },
        params: { address_id: "addr_other_user" },
        scope: mockContainer,
        validatedBody: { first_name: "Hacker" },
        queryConfig: { fields: ["id"] },
      }

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await expect(updateAddressHandler(req, res)).rejects.toThrow(
        expect.objectContaining({
          type: MedusaError.Types.NOT_FOUND,
          message: "Address with id: addr_other_user was not found",
        })
      )
    })
  })

  describe("DELETE /store/customers/me/addresses/:address_id (Delete Address IDOR Protection)", () => {
    it("prevents deleting an address belonging to another customer", async () => {
      mockRemoteQuery.mockResolvedValueOnce([])

      const req: any = {
        auth_context: { actor_id: "cus_123" },
        params: { address_id: "addr_other_user" },
        scope: mockContainer,
        queryConfig: { fields: ["id"] },
      }

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await expect(deleteAddressHandler(req, res)).rejects.toThrow(
        expect.objectContaining({
          type: MedusaError.Types.NOT_FOUND,
          message: "Address with id: addr_other_user was not found",
        })
      )
    })
  })
})
