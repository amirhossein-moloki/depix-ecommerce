import createKnex, { Knex } from "knex"
import { validateAndTransformQuery } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GET as getSalesReport } from "../route"
import { SalesReportingService } from "../sales-reporting.service"
import { AdminGetSalesReportParams } from "../validators"

describe("Sales Reporting System Unit & SQL Compilation Tests", () => {
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

  describe("SalesReportingService Financial Aggregations", () => {
    it("should aggregate core metrics correctly for single currency using real PG SQL", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }]
        }
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: 5 }
        }
        if (isFirst && sql.includes("as items_sold") && sql.includes("as gross_sales")) {
          return { items_sold: 10, gross_sales: 500, discounts: 50 }
        }
        if (isFirst && sql.includes("as item_tax")) {
          return { item_tax: 25, exclusive_item_tax: 25 }
        }
        if (isFirst && sql.includes("as shipping") && !sql.includes("shipping_tax")) {
          return { shipping: 20 }
        }
        if (isFirst && sql.includes("as shipping_tax")) {
          return { shipping_tax: 2, exclusive_shipping_tax: 2 }
        }
        if (isFirst && sql.includes("as refund_amount")) {
          return { refund_amount: 10 }
        }
        if (isFirst && sql.includes("as cancelled_amount")) {
          return { cancelled_amount: 100 }
        }
        return isFirst ? {} : []
      })

      const service = new SalesReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })
      const report = await service.getSalesReport({
        from: "2025-01-01",
        to: "2025-01-31",
      })

      assertValidOrderSchemaSql(capturedSql)
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
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "usd" }, { currency_code: "eur" }]
        }
        const curr = bindings.includes("eur") ? "eur" : "usd"
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: curr === "usd" ? 2 : 3 }
        }
        if (isFirst && sql.includes("as items_sold") && sql.includes("as gross_sales")) {
          return curr === "usd"
            ? { items_sold: 4, gross_sales: 200, discounts: 20 }
            : { items_sold: 6, gross_sales: 300, discounts: 30 }
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
        if (isFirst && sql.includes("as refund_amount")) {
          return { refund_amount: 0 }
        }
        if (isFirst && sql.includes("as cancelled_amount")) {
          return { cancelled_amount: 0 }
        }
        return isFirst ? {} : []
      })

      const service = new SalesReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getSalesReport()

      assertValidOrderSchemaSql(capturedSql)
      expect(report.currencies).toEqual(["usd", "eur"])
      expect(report.summary).toBeNull() // Safe multi-currency protection
      expect(report.summary_by_currency?.usd?.net_sales).toBe(201) // 200 - 20 + 11 + 10
      expect(report.summary_by_currency?.eur?.net_sales).toBe(301.5) // 300 - 30 + 16.5 + 15
    })

    it("returns zeroed IRR summary with empty breakdown when called with no parameters on empty database", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((_sql, _bindings, isFirst) =>
        isFirst ? {} : []
      )

      const service = new SalesReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const report = await service.getSalesReport()

      assertValidOrderSchemaSql(capturedSql)
      expect(report).toEqual({
        currencies: [],
        summary: {
          currency_code: "irr",
          gross_sales: 0,
          discounts: 0,
          tax: 0,
          shipping: 0,
          refund_amount: 0,
          net_sales: 0,
          order_count: 0,
          items_sold: 0,
          average_order_value: 0,
          cancelled_order_amount: 0,
        },
        summary_by_currency: undefined,
        breakdown: [],
        count: 0,
        limit: 50,
        offset: 0,
      })
    })

    it("computes product breakdown cleanly and verifies compiled SQL across all group_by modes and filters", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "irr" }]
        }
        if (isFirst && sql.includes('count(*) as "count"')) {
          return { count: 1 }
        }
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: 1 }
        }
        if (isFirst) {
          return {
            items_sold: 5,
            gross_sales: 100,
            discounts: 10,
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
              product_title: "T-Shirt",
              units_sold: 5,
              gross_sales: 100,
              discounts: 10,
            },
          ]
        }
        return []
      })

      const service = new SalesReportingService({
        [ContainerRegistrationKeys.PG_CONNECTION]: knex,
      })

      const productReport = await service.getSalesReport({
        group_by: "product",
        product_id: "prod_1",
        variant_id: "var_1",
        category_id: "cat_1",
        payment_method: "zibal",
        from: "2026-01-01",
        to: "2026-12-31",
      })
      expect(productReport.breakdown).toEqual([
        {
          product_id: "prod_1",
          product_title: "T-Shirt",
          units_sold: 5,
          gross_sales: 100,
          discounts: 10,
          net_sales: 90,
        },
      ])

      const allGroupModes: Array<
        | "day"
        | "week"
        | "month"
        | "year"
        | "product"
        | "variant"
        | "category"
        | "customer"
        | "payment_method"
        | "currency"
      > = [
        "day",
        "week",
        "month",
        "year",
        "product",
        "variant",
        "category",
        "customer",
        "payment_method",
        "currency",
      ]

      for (const group_by of allGroupModes) {
        await service.getSalesReport({ group_by })
      }

      assertValidOrderSchemaSql(capturedSql)

      // Shipping queries must traverse order_shipping -> order_shipping_method and exclude return/exchange/claim methods
      const shippingSqls = capturedSql.filter((s) => s.includes('"order_shipping"'))
      expect(shippingSqls.length).toBeGreaterThan(0)
      for (const s of shippingSqls) {
        expect(s).toContain('"order_shipping_method"')
        expect(s).toContain('"os"."return_id" is null')
        expect(s).toContain('"os"."exchange_id" is null')
        expect(s).toContain('"os"."claim_id" is null')
      }

      // Tax queries must read rate from order_line_item_tax_line and order_shipping_method_tax_line
      const itemTaxSqls = capturedSql.filter((s) =>
        s.includes('"order_line_item_tax_line"')
      )
      expect(itemTaxSqls.length).toBeGreaterThan(0)
      for (const s of itemTaxSqls) {
        expect(s).toMatch(/CAST\(rate AS NUMERIC\)/i)
      }

      const shipTaxSqls = capturedSql.filter((s) =>
        s.includes('"order_shipping_method_tax_line"')
      )
      expect(shipTaxSqls.length).toBeGreaterThan(0)
      for (const s of shipTaxSqls) {
        expect(s).toMatch(/CAST\(rate AS NUMERIC\)/i)
      }

      // Order item joins (direct or pre-aggregated subqueries) must scope to o.version
      const itemJoinSqls = capturedSql.filter(
        (s) => s.includes('"order_item" as "oi"') && s.includes('"order" as "o"')
      )
      expect(itemJoinSqls.length).toBeGreaterThan(0)
      for (const s of itemJoinSqls) {
        expect(s).toMatch(
          /(?:"oi"|"oitem_agg"|"oitem_cust"|"osales_pm"|"osales_curr")\."version"\s*=\s*"o"\."version"/i
        )
      }
    })
  })

  describe("GET /admin/reports/sales Middleware & Route Handler", () => {
    const runValidation = async (query: Record<string, any>) => {
      const middleware = validateAndTransformQuery(AdminGetSalesReportParams, {
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
          "payment_method",
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

    it("handles requests with no parameters and empty string params cleanly (200 OK)", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "irr" }]
        }
        if (isFirst && sql.includes('count(distinct "o"."id")')) {
          return { count: 3 }
        }
        if (isFirst && sql.includes("as items_sold") && sql.includes("as gross_sales")) {
          return { items_sold: 4, gross_sales: 1500000, discounts: 100000 }
        }
        if (isFirst && sql.includes("as item_tax")) {
          return { item_tax: 0, exclusive_item_tax: 0 }
        }
        if (isFirst && sql.includes("as shipping") && !sql.includes("shipping_tax")) {
          return { shipping: 50000 }
        }
        if (isFirst && sql.includes("as shipping_tax")) {
          return { shipping_tax: 0, exclusive_shipping_tax: 0 }
        }
        if (isFirst && sql.includes("as refund_amount")) {
          return { refund_amount: 0 }
        }
        if (isFirst && sql.includes("as cancelled_amount")) {
          return { cancelled_amount: 0 }
        }
        return isFirst ? {} : []
      })

      for (const query of [{}, { from: "", to: "", group_by: "" }]) {
        const req = await runValidation(query)
        req.scope = {
          resolve: jest.fn((key: string) =>
            key === ContainerRegistrationKeys.PG_CONNECTION ? knex : undefined
          ),
        }
        const statusMock = jest.fn().mockReturnThis()
        const jsonMock = jest.fn()

        await getSalesReport(req, { status: statusMock, json: jsonMock } as any)

        expect(statusMock).toHaveBeenCalledWith(200)
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            currencies: ["irr"],
            summary: expect.objectContaining({
              currency_code: "irr",
              net_sales: 1450000,
              order_count: 3,
            }),
            breakdown: [],
          })
        )
      }

      assertValidOrderSchemaSql(capturedSql)
    })

    it("supports start_date/end_date with group_by=year and group_by=customer", async () => {
      const { knex, capturedSql } = createPgSqlCapturingKnex((sql, _bindings, isFirst) => {
        if (!isFirst && sql.includes("select distinct LOWER(o.currency_code) as currency_code")) {
          return [{ currency_code: "irr" }]
        }
        if (isFirst && sql.includes('count(*) as "count"')) {
          return { count: 1 }
        }
        if (isFirst) {
          return {
            count: 2,
            items_sold: 3,
            gross_sales: 2000000,
            discounts: 0,
            item_tax: 0,
            exclusive_item_tax: 0,
            shipping: 100000,
            shipping_tax: 0,
            exclusive_shipping_tax: 0,
            refund_amount: 0,
            cancelled_amount: 0,
          }
        }
        if (sql.includes("DATE_TRUNC('year'")) {
          return [
            {
              date: "2026-01-01",
              orders: 2,
              items_sold: 3,
              gross_sales: 2000000,
              discounts: 0,
              shipping: 100000,
            },
          ]
        }
        if (sql.includes('"customer" as "c"')) {
          return [
            {
              customer_id: "cus_1",
              email: "ali@example.com",
              first_name: "Ali",
              last_name: "Rezaei",
              orders: 2,
              items_sold: 3,
              gross_sales: 2000000,
              discounts: 0,
              shipping: 100000,
            },
          ]
        }
        return []
      })

      const yearReq = await runValidation({
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        group_by: "year",
      })
      yearReq.scope = {
        resolve: jest.fn((key: string) =>
          key === ContainerRegistrationKeys.PG_CONNECTION ? knex : undefined
        ),
      }
      const yearJson = jest.fn()
      await getSalesReport(
        yearReq,
        { status: jest.fn().mockReturnThis(), json: yearJson } as any
      )
      expect(yearJson).toHaveBeenCalledWith(
        expect.objectContaining({
          breakdown: [
            expect.objectContaining({
              date: "2026-01-01",
              orders: 2,
              net_sales: 2100000,
            }),
          ],
        })
      )

      const custReq = await runValidation({ group_by: "customer" })
      custReq.scope = yearReq.scope
      const custJson = jest.fn()
      await getSalesReport(
        custReq,
        { status: jest.fn().mockReturnThis(), json: custJson } as any
      )
      expect(custJson).toHaveBeenCalledWith(
        expect.objectContaining({
          breakdown: [
            {
              customer_id: "cus_1",
              email: "ali@example.com",
              customer_name: "Ali Rezaei",
              orders: 2,
              items_sold: 3,
              gross_sales: 2000000,
              discounts: 0,
              shipping: 100000,
              net_sales: 2100000,
            },
          ],
          count: 1,
        })
      )

      assertValidOrderSchemaSql(capturedSql)
    })
  })
})
