import { GET as getSalesReport } from "../route"
import { SalesReportingService } from "../sales-reporting.service"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("Sales Reporting System Unit & Integration Tests", () => {
  describe("SalesReportingService Financial Aggregations", () => {
    it("should aggregate core metrics correctly for single currency", async () => {
      let callCount = 0
      const mockKnex: any = jest.fn((tableName: string) => {
        callCount++
        const currentCall = callCount

        const queryBuilder: any = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          whereRaw: jest.fn().mockReturnThis(),
          whereExists: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          countDistinct: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          groupByRaw: jest.fn().mockReturnThis(),
          orderByRaw: jest.fn().mockReturnThis(),
          as: jest.fn().mockReturnThis(),
          first: jest.fn().mockImplementation(() => {
            if (currentCall === 4) return Promise.resolve({ count: 5 })
            if (currentCall === 5) return Promise.resolve({ items_sold: 10, gross_sales: 500, discounts: 50 })
            if (currentCall === 6) return Promise.resolve({ item_tax: 25 })
            if (currentCall === 8) return Promise.resolve({ shipping: 20 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 2 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 10 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 100 })
            return Promise.resolve({})
          }),
          then: jest.fn((resolve) => resolve([{ currency_code: "usd" }])),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const mockContainer = {
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      }

      const service = new SalesReportingService(mockContainer)
      const report = await service.getSalesReport({ from: "2025-01-01", to: "2025-01-31" })

      expect(report.currencies).toEqual(["usd"])
      expect(report.summary).not.toBeNull()
      expect(report.summary?.currency_code).toBe("usd")
      expect(report.summary?.gross_sales).toBe(500)
      expect(report.summary?.discounts).toBe(50)
      expect(report.summary?.tax).toBe(27) // 25 + 2
      expect(report.summary?.shipping).toBe(20)
      expect(report.summary?.refund_amount).toBe(10)
      expect(report.summary?.net_sales).toBe(487) // 500 - 50 + 27 + 20 - 10
      expect(report.summary?.order_count).toBe(5)
      expect(report.summary?.items_sold).toBe(10)
      expect(report.summary?.average_order_value).toBe(97.4) // 487 / 5
      expect(report.summary?.cancelled_order_amount).toBe(100)
    })

    it("should prevent cross-currency summation when multiple currencies exist without filter", async () => {
      let callCount = 0
      const mockKnex: any = jest.fn((tableName: string) => {
        callCount++
        const currentCall = callCount

        const queryBuilder: any = {
          select: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          whereRaw: jest.fn().mockReturnThis(),
          whereExists: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          countDistinct: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          groupByRaw: jest.fn().mockReturnThis(),
          orderByRaw: jest.fn().mockReturnThis(),
          as: jest.fn().mockReturnThis(),
          first: jest.fn().mockImplementation(() => {
            // USD
            if (currentCall === 4) return Promise.resolve({ count: 2 })
            if (currentCall === 5) return Promise.resolve({ items_sold: 4, gross_sales: 200, discounts: 20 })
            if (currentCall === 6) return Promise.resolve({ item_tax: 10 })
            if (currentCall === 8) return Promise.resolve({ shipping: 10 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 1 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 0 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 0 })
            // EUR
            if (currentCall === 15) return Promise.resolve({ count: 3 })
            if (currentCall === 16) return Promise.resolve({ items_sold: 6, gross_sales: 300, discounts: 30 })
            if (currentCall === 17) return Promise.resolve({ item_tax: 15 })
            if (currentCall === 19) return Promise.resolve({ shipping: 15 })
            if (currentCall === 21) return Promise.resolve({ shipping_tax: 1.5 })
            if (currentCall === 22) return Promise.resolve({ refund_amount: 0 })
            if (currentCall === 23) return Promise.resolve({ cancelled_amount: 0 })
            return Promise.resolve({})
          }),
          then: jest.fn((resolve) => resolve([{ currency_code: "usd" }, { currency_code: "eur" }])),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new SalesReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getSalesReport()

      expect(report.currencies).toEqual(["usd", "eur"])
      expect(report.summary).toBeNull() // Safe multi-currency protection
      expect(report.summary_by_currency?.usd?.net_sales).toBe(201) // 200 - 20 + 11 + 10
      expect(report.summary_by_currency?.eur?.net_sales).toBe(301.5) // 300 - 30 + 16.5 + 15
    })

    it("should compute product breakdown correctly", async () => {
      const mockKnex: any = jest.fn((tableName: any) => {
        const queryBuilder: any = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          whereRaw: jest.fn().mockReturnThis(),
          whereExists: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          countDistinct: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          groupByRaw: jest.fn().mockReturnThis(),
          orderByRaw: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis(),
          as: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ count: 1 }),
          then: jest.fn((resolve) => {
            if (tableName === "order_line_item as oli") {
              return resolve([{ product_id: "prod_1", product_title: "T-Shirt", units_sold: 5, gross_sales: 100, discounts: 10 }])
            }
            return resolve([{ currency_code: "usd" }])
          }),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new SalesReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getSalesReport({ group_by: "product" })

      expect(report.breakdown).toHaveLength(1)
      expect(report.breakdown[0]).toEqual({
        product_id: "prod_1",
        product_title: "T-Shirt",
        units_sold: 5,
        gross_sales: 100,
        discounts: 10,
        net_sales: 90,
      })
    })
  })

  describe("GET /admin/reports/sales API Route Handler", () => {
    it("should return 200 OK with sales report payload", async () => {
      let callCount = 0
      const mockKnex: any = jest.fn(() => {
        callCount++
        const currentCall = callCount

        return {
          select: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          whereRaw: jest.fn().mockReturnThis(),
          whereExists: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          countDistinct: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          groupByRaw: jest.fn().mockReturnThis(),
          orderByRaw: jest.fn().mockReturnThis(),
          as: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ count: 1, items_sold: 2, gross_sales: 100, discounts: 10, item_tax: 5, shipping: 5, shipping_tax: 0, refund_amount: 0, cancelled_amount: 0 }),
          then: jest.fn((resolve) => {
            if (currentCall === 1) return resolve([{ currency_code: "usd" }])
            return resolve([{ date: "2025-01-01", orders: 1, items_sold: 2, gross_sales: 100, discounts: 10, shipping: 5 }])
          }),
        }
      })
      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const req: any = {
        scope: {
          [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
        },
        validatedQuery: {
          from: "2025-01-01",
          to: "2025-01-31",
          group_by: "day",
          limit: 20,
          offset: 0,
        },
      }

      const statusMock = jest.fn().mockReturnThis()
      const jsonMock = jest.fn()
      const res: any = {
        status: statusMock,
        json: jsonMock,
      }

      await getSalesReport(req, res)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: expect.any(Array),
          summary: expect.any(Object),
          breakdown: expect.any(Array),
        })
      )
    })
  })
})
