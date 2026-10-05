import { GET as getMarginReport } from "../route"
import { MarginReportingService } from "../margin-reporting.service"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("Margin Reporting System Unit & Integration Tests", () => {
  describe("MarginReportingService Financial Aggregations", () => {
    it("should aggregate revenue, COGS, gross profit, and gross margin % correctly for single currency", async () => {
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
            if (currentCall === 5)
              return Promise.resolve({
                items_sold: 10,
                gross_sales: 1000,
                discounts: 100,
                cogs: 400,
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              })
            if (currentCall === 6) return Promise.resolve({ item_tax: 50 })
            if (currentCall === 8) return Promise.resolve({ shipping: 50 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 5 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 20 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 0 })
            return Promise.resolve({})
          }),
          then: jest.fn((resolve) => resolve([{ currency_code: "usd" }])),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getMarginReport({ from: "2026-01-01", to: "2026-01-31" })

      expect(report.currencies).toEqual(["usd"])
      expect(report.summary).not.toBeNull()
      expect(report.summary?.currency_code).toBe("usd")
      expect(report.summary?.gross_sales).toBe(1000)
      expect(report.summary?.discounts).toBe(100)
      expect(report.summary?.tax).toBe(55) // 50 + 5
      expect(report.summary?.shipping).toBe(50)
      expect(report.summary?.refund_amount).toBe(20)
      // Net Sales = 1000 - 100 + 55 + 50 - 20 = 985
      expect(report.summary?.net_sales).toBe(985)
      expect(report.summary?.cogs).toBe(400)
      // Gross Profit = 985 - 400 = 585
      expect(report.summary?.gross_profit).toBe(585)
      // Gross Margin % = (585 / 985) * 100 = 59.39%
      expect(report.summary?.gross_margin_percentage).toBe(59.39)
      expect(report.summary?.order_count).toBe(5)
      expect(report.summary?.items_sold).toBe(10)
      expect(report.summary?.items_with_missing_cost).toBe(0)
      expect(report.summary?.orders_with_missing_cost).toBe(0)
    })

    it("should handle missing costs without defaulting to zero and report missing cost indicators", async () => {
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
            if (currentCall === 4) return Promise.resolve({ count: 2 })
            if (currentCall === 5)
              return Promise.resolve({
                items_sold: 4,
                gross_sales: 400,
                discounts: 0,
                cogs: 100, // COGS only for items with known cost
                items_with_missing_cost: 2,
                orders_with_missing_cost: 1,
              })
            if (currentCall === 6) return Promise.resolve({ item_tax: 0 })
            if (currentCall === 8) return Promise.resolve({ shipping: 0 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 0 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 0 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 0 })
            return Promise.resolve({})
          }),
          then: jest.fn((resolve) => resolve([{ currency_code: "usd" }])),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getMarginReport()

      expect(report.summary?.items_with_missing_cost).toBe(2)
      expect(report.summary?.orders_with_missing_cost).toBe(1)
      expect(report.summary?.cogs).toBe(100)
    })

    it("should compute negative margins correctly when COGS exceeds net sales", async () => {
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
            if (currentCall === 4) return Promise.resolve({ count: 1 })
            if (currentCall === 5)
              return Promise.resolve({
                items_sold: 1,
                gross_sales: 100,
                discounts: 20,
                cogs: 120, // COGS = 120 > Net Sales = 80
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              })
            if (currentCall === 6) return Promise.resolve({ item_tax: 0 })
            if (currentCall === 8) return Promise.resolve({ shipping: 0 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 0 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 0 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 0 })
            return Promise.resolve({})
          }),
          then: jest.fn((resolve) => resolve([{ currency_code: "usd" }])),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getMarginReport()

      expect(report.summary?.net_sales).toBe(80)
      expect(report.summary?.cogs).toBe(120)
      expect(report.summary?.gross_profit).toBe(-40)
      expect(report.summary?.gross_margin_percentage).toBe(-50)
    })

    it("should handle zero net sales without division-by-zero or NaN errors", async () => {
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
            if (currentCall === 4) return Promise.resolve({ count: 0 })
            if (currentCall === 5)
              return Promise.resolve({
                items_sold: 0,
                gross_sales: 0,
                discounts: 0,
                cogs: 0,
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              })
            if (currentCall === 6) return Promise.resolve({ item_tax: 0 })
            if (currentCall === 8) return Promise.resolve({ shipping: 0 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 0 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 0 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 0 })
            return Promise.resolve({})
          }),
          then: jest.fn((resolve) => resolve([{ currency_code: "usd" }])),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getMarginReport()

      expect(report.summary?.net_sales).toBe(0)
      expect(report.summary?.gross_profit).toBe(0)
      expect(report.summary?.gross_margin_percentage).toBe(0)
      expect(Number.isNaN(report.summary?.gross_margin_percentage)).toBe(false)
    })

    it("should isolate multi-currency aggregations safely", async () => {
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
            if (currentCall === 5)
              return Promise.resolve({
                items_sold: 4,
                gross_sales: 200,
                discounts: 20,
                cogs: 80,
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              })
            if (currentCall === 6) return Promise.resolve({ item_tax: 10 })
            if (currentCall === 8) return Promise.resolve({ shipping: 10 })
            if (currentCall === 10) return Promise.resolve({ shipping_tax: 1 })
            if (currentCall === 11) return Promise.resolve({ refund_amount: 0 })
            if (currentCall === 12) return Promise.resolve({ cancelled_amount: 0 })
            // EUR
            if (currentCall === 15) return Promise.resolve({ count: 3 })
            if (currentCall === 16)
              return Promise.resolve({
                items_sold: 6,
                gross_sales: 300,
                discounts: 30,
                cogs: 150,
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              })
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

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getMarginReport()

      expect(report.currencies).toEqual(["usd", "eur"])
      expect(report.summary).toBeNull() // Safe multi-currency protection
      expect(report.summary_by_currency?.usd?.net_sales).toBe(201)
      expect(report.summary_by_currency?.usd?.gross_profit).toBe(121) // 201 - 80
      expect(report.summary_by_currency?.eur?.net_sales).toBe(301.5)
      expect(report.summary_by_currency?.eur?.gross_profit).toBe(151.5) // 301.5 - 150
    })

    it("should compute product breakdown with profit and margin %", async () => {
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
              return resolve([
                {
                  product_id: "prod_1",
                  product_title: "Headphones",
                  units_sold: 2,
                  gross_sales: 200,
                  discounts: 20,
                  cogs: 100,
                  items_with_missing_cost: 0,
                },
              ])
            }
            return resolve([{ currency_code: "usd" }])
          }),
        }

        return queryBuilder
      })

      mockKnex.raw = (sql: string) => sql
      mockKnex.from = (sub: any) => mockKnex(sub)

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: mockKnex,
      })

      const report = await service.getMarginReport({ group_by: "product" })

      expect(report.breakdown).toHaveLength(1)
      expect(report.breakdown[0]).toEqual({
        product_id: "prod_1",
        product_title: "Headphones",
        units_sold: 2,
        gross_sales: 200,
        discounts: 20,
        net_sales: 180,
        cogs: 100,
        gross_profit: 80,
        gross_margin_percentage: 44.44, // (80 / 180) * 100
        items_with_missing_cost: 0,
      })
    })
  })

  describe("GET /admin/reports/margin API Route Handler", () => {
    it("should return 200 OK with margin report payload", async () => {
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
          first: jest.fn().mockResolvedValue({
            count: 1,
            items_sold: 2,
            gross_sales: 100,
            discounts: 10,
            cogs: 40,
            items_with_missing_cost: 0,
            orders_with_missing_cost: 0,
            item_tax: 5,
            shipping: 5,
            shipping_tax: 0,
            refund_amount: 0,
            cancelled_amount: 0,
          }),
          then: jest.fn((resolve) => {
            if (currentCall === 1) return resolve([{ currency_code: "usd" }])
            return resolve([
              {
                date: "2026-01-01",
                orders: 1,
                items_sold: 2,
                gross_sales: 100,
                discounts: 10,
                shipping: 5,
                cogs: 40,
              },
            ])
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
          from: "2026-01-01",
          to: "2026-01-31",
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

      await getMarginReport(req, res)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: expect.any(Array),
          summary: expect.objectContaining({
            currency_code: "usd",
            gross_sales: 100,
            cogs: 40,
            gross_profit: 60, // (100 - 10 + 5 + 5 - 0) - 40 = 100 - 40 = 60
            gross_margin_percentage: 60, // (60 / 100) * 100
          }),
          breakdown: expect.any(Array),
        })
      )
    })
  })
})
