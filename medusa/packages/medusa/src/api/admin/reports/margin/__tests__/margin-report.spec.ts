import createKnex, { Knex } from "knex"
import { validateAndTransformQuery } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GET as getMarginReport } from "../route"
import { MarginReportingService } from "../margin-reporting.service"
import { AdminGetMarginReportParams } from "../validators"

describe("Margin Reporting System Unit & SQL Compilation Tests", () => {
  const createdKnexInstances: Knex[] = []

  const createPgSqlCapturingKnex = (
    responder: (sql: string, bindings: readonly unknown[], isFirst: boolean) => any
  ) => {
    const capturedSql: string[] = []
    const knexInstance = createKnex({ client: "pg" })
    createdKnexInstances.push(knexInstance)

    knexInstance.client.runner = function (builder: any) {
      return {
        run() {
          const compiled = builder.toSQL()
          const queries = Array.isArray(compiled) ? compiled : [compiled]
          const primary = queries[0]
          for (const q of queries) {
            capturedSql.push(q.sql)
          }
          const isFirst = builder._method === "first"
          return Promise.resolve(
            responder(primary?.sql ?? "", primary?.bindings ?? [], isFirst)
          )
        },
      }
    }

    return { knex: knexInstance, capturedSql }
  }

  const assertValidOrderSchemaSql = (sqlStatements: string[]) => {
    expect(sqlStatements.length).toBeGreaterThan(0)
    for (const sql of sqlStatements) {
      expect(sql).not.toMatch(/order_line_item_tax_line[^;]*\.\s*"?amount"?/i)
      expect(sql).not.toMatch(/order_shipping_method_tax_line[^;]*\.\s*"?amount"?/i)
      expect(sql).not.toMatch(/"?order_shipping_method"?\s+as\s+"?osm"?[^;]*\bosm\."?order_id"?/i)
      expect(sql).not.toMatch(/from\s+"order_shipping_method"[^;]*\b"order_id"/i)
      expect(sql).not.toMatch(/\bosm\."?order_id"?/i)
      expect(sql).not.toMatch(/\bosmtl\."?amount"?/i)
    }
  }

  afterEach(async () => {
    while (createdKnexInstances.length > 0) {
      const k = createdKnexInstances.pop()
      await k?.destroy()
    }
  })

  describe("MarginReportingService Financial Aggregations", () => {
    it("should aggregate revenue, COGS, gross profit, and gross margin % correctly for single currency", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: 5 }
        }
        if (isFirst && sql.includes("as cogs")) {
          return {
            items_sold: 10,
            gross_sales: 1000,
            discounts: 100,
            cogs: 400,
            items_with_missing_cost: 0,
            orders_with_missing_cost: 0,
          }
        }
        if (isFirst && sql.includes("as item_tax")) {
          return { item_tax: 50, exclusive_item_tax: 50 }
        }
        if (isFirst && sql.includes("as shipping") && !sql.includes("shipping_tax")) {
          return { shipping: 50 }
        }
        if (isFirst && sql.includes("as shipping_tax")) {
          return { shipping_tax: 5, exclusive_shipping_tax: 5 }
        }
        if (isFirst && sql.includes("as refund_amount")) {
          return { refund_amount: 20 }
        }
        if (isFirst && sql.includes("as cancelled_amount")) {
          return { cancelled_amount: 0 }
        }
        return isFirst ? {} : []
      })

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getMarginReport({
        from: "2026-01-01",
        to: "2026-01-31",
      })

      assertValidOrderSchemaSql(capturedSql)
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

    it("should handle missing costs without defaulting to zero and guard metadata numeric casts", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: 2 }
        }
        if (isFirst && sql.includes("as cogs")) {
          return {
            items_sold: 4,
            gross_sales: 400,
            discounts: 0,
            cogs: 100,
            items_with_missing_cost: 2,
            orders_with_missing_cost: 1,
          }
        }
        return isFirst
          ? {
              item_tax: 0,
              exclusive_item_tax: 0,
              shipping: 0,
              shipping_tax: 0,
              exclusive_shipping_tax: 0,
              refund_amount: 0,
              cancelled_amount: 0,
            }
          : []
      })

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getMarginReport()

      assertValidOrderSchemaSql(capturedSql)
      const cogsSql = capturedSql.find((s) => s.includes("as cogs"))
      expect(cogsSql).toContain("~ '^-?[0-9]+(\\.[0-9]+)?$'")
      expect(report.summary?.items_with_missing_cost).toBe(2)
      expect(report.summary?.orders_with_missing_cost).toBe(1)
      expect(report.summary?.cogs).toBe(100)
    })

    it("should compute negative margins correctly when COGS exceeds net sales", async () => {
      const { knex } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: 1 }
        }
        if (isFirst && sql.includes("as cogs")) {
          return {
            items_sold: 1,
            gross_sales: 100,
            discounts: 20,
            cogs: 120,
            items_with_missing_cost: 0,
            orders_with_missing_cost: 0,
          }
        }
        return isFirst
          ? {
              item_tax: 0,
              exclusive_item_tax: 0,
              shipping: 0,
              shipping_tax: 0,
              exclusive_shipping_tax: 0,
              refund_amount: 0,
              cancelled_amount: 0,
            }
          : []
      })

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getMarginReport()

      expect(report.summary?.net_sales).toBe(80)
      expect(report.summary?.cogs).toBe(120)
      expect(report.summary?.gross_profit).toBe(-40)
      expect(report.summary?.gross_margin_percentage).toBe(-50)
    })

    it("should handle zero net sales without division-by-zero or NaN errors", async () => {
      const { knex } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        return isFirst
          ? {
              count: 0,
              items_sold: 0,
              gross_sales: 0,
              discounts: 0,
              cogs: 0,
              items_with_missing_cost: 0,
              orders_with_missing_cost: 0,
              item_tax: 0,
              exclusive_item_tax: 0,
              shipping: 0,
              shipping_tax: 0,
              exclusive_shipping_tax: 0,
              refund_amount: 0,
              cancelled_amount: 0,
            }
          : []
      })

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getMarginReport()

      expect(report.summary?.net_sales).toBe(0)
      expect(report.summary?.gross_profit).toBe(0)
      expect(report.summary?.gross_margin_percentage).toBe(0)
      expect(Number.isNaN(report.summary?.gross_margin_percentage)).toBe(false)
    })

    it("should isolate multi-currency aggregations safely", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }, { currency_code: "eur" }]
        }
        const curr = bindings.includes("eur") ? "eur" : "usd"
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: curr === "usd" ? 2 : 3 }
        }
        if (isFirst && sql.includes("as cogs")) {
          return curr === "usd"
            ? {
                items_sold: 4,
                gross_sales: 200,
                discounts: 20,
                cogs: 80,
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              }
            : {
                items_sold: 6,
                gross_sales: 300,
                discounts: 30,
                cogs: 150,
                items_with_missing_cost: 0,
                orders_with_missing_cost: 0,
              }
        }
        if (isFirst && sql.includes("as item_tax")) {
          return curr === "usd"
            ? { item_tax: 10, exclusive_item_tax: 10 }
            : { item_tax: 15, exclusive_item_tax: 15 }
        }
        if (isFirst && sql.includes("as shipping") && !sql.includes("shipping_tax")) {
          return { shipping: curr === "usd" ? 10 : 15 }
        }
        if (isFirst && sql.includes("as shipping_tax")) {
          return curr === "usd"
            ? { shipping_tax: 1, exclusive_shipping_tax: 1 }
            : { shipping_tax: 1.5, exclusive_shipping_tax: 1.5 }
        }
        return isFirst ? { refund_amount: 0, cancelled_amount: 0 } : []
      })

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getMarginReport()

      assertValidOrderSchemaSql(capturedSql)
      expect(report.currencies).toEqual(["usd", "eur"])
      expect(report.summary).toBeNull() // Safe multi-currency protection
      expect(report.summary_by_currency?.usd?.net_sales).toBe(201)
      expect(report.summary_by_currency?.usd?.gross_profit).toBe(121) // 201 - 80
      expect(report.summary_by_currency?.eur?.net_sales).toBe(301.5)
      expect(report.summary_by_currency?.eur?.gross_profit).toBe(151.5) // 301.5 - 150
    })

    it("should compute product breakdown and compile valid PG SQL across all group_by modes", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        if (isFirst && sql.includes('count(*) as "count"')) {
          return { count: 1 }
        }
        if (isFirst) {
          return {
            count: 1,
            items_sold: 2,
            gross_sales: 200,
            discounts: 20,
            cogs: 100,
            items_with_missing_cost: 0,
            orders_with_missing_cost: 0,
            item_tax: 0,
            exclusive_item_tax: 0,
            shipping: 0,
            shipping_tax: 0,
            exclusive_shipping_tax: 0,
            refund_amount: 0,
            cancelled_amount: 0,
          }
        }
        if (sql.includes('"oli"."product_id"')) {
          return [
            {
              product_id: "prod_1",
              product_title: "Headphones",
              units_sold: 2,
              gross_sales: 200,
              discounts: 20,
              cogs: 100,
              items_with_missing_cost: 0,
            },
          ]
        }
        return []
      })

      const service = new MarginReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
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

      for (const group_by of [
        "day",
        "week",
        "month",
        "year",
        "product",
        "variant",
        "category",
        "currency",
      ] as const) {
        await service.getMarginReport({ group_by })
      }

      assertValidOrderSchemaSql(capturedSql)
    })
  })

  describe("GET /admin/reports/margin Middleware & Route Handler", () => {
    const runValidation = async (query: Record<string, any>) => {
      const middleware = validateAndTransformQuery(AdminGetMarginReportParams, {
        defaults: [
          "from",
          "to",
          "start_date",
          "end_date",
          "group_by",
          "order_status",
          "product_id",
          "variant_id",
          "category_id",
          "customer_id",
          "currency",
          "limit",
          "offset",
        ],
        isList: true,
      })

      const req: any = { query, allowed: [] }
      await new Promise<void>((resolve, reject) => {
        middleware(req, {} as any, (err?: unknown) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      })
      return req
    }

    it("should return 200 OK with empty query params and with start_date/end_date", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        if (isFirst) {
          return {
            count: 1,
            items_sold: 2,
            gross_sales: 100,
            discounts: 10,
            cogs: 40,
            items_with_missing_cost: 0,
            orders_with_missing_cost: 0,
            item_tax: 5,
            exclusive_item_tax: 5,
            shipping: 5,
            shipping_tax: 0,
            exclusive_shipping_tax: 0,
            refund_amount: 0,
            cancelled_amount: 0,
          }
        }
        if (sql.includes("DATE_TRUNC('day'")) {
          return [
            {
              date: "2026-01-01",
              orders: 1,
              items_sold: 2,
              gross_sales: 100,
              discounts: 10,
              shipping: 5,
              cogs: 40,
            },
          ]
        }
        return []
      })

      const emptyReq = await runValidation({})
      emptyReq.scope = {
        resolve: jest.fn((key: string) =>
          key === ContainerRegistrationKeys.PG_CONNECTION ? knex : undefined
        ),
      }
      const emptyStatus = jest.fn().mockReturnThis()
      const emptyJson = jest.fn()
      await getMarginReport(emptyReq, { status: emptyStatus, json: emptyJson } as any)
      expect(emptyStatus).toHaveBeenCalledWith(200)
      expect(emptyJson).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: ["usd"],
          summary: expect.objectContaining({
            currency_code: "usd",
            gross_sales: 100,
            cogs: 40,
            gross_profit: 60,
            gross_margin_percentage: 60,
          }),
          breakdown: [],
        })
      )

      const rangeReq = await runValidation({
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        group_by: "day",
        limit: "20",
        offset: "0",
      })
      rangeReq.scope = emptyReq.scope
      const statusMock = jest.fn().mockReturnThis()
      const jsonMock = jest.fn()
      await getMarginReport(rangeReq, { status: statusMock, json: jsonMock } as any)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          currencies: expect.any(Array),
          summary: expect.objectContaining({
            currency_code: "usd",
            gross_sales: 100,
            cogs: 40,
            gross_profit: 60,
            gross_margin_percentage: 60,
          }),
          breakdown: [
            expect.objectContaining({
              date: "2026-01-01",
              gross_profit: 55,
            }),
          ],
        })
      )

      assertValidOrderSchemaSql(capturedSql)
    })
  })
})
