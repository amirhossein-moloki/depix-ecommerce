import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { Knex } from "knex"

export interface MarginReportOptions {
  from?: string | Date
  to?: string | Date
  group_by?:
    | "day"
    | "week"
    | "month"
    | "year"
    | "product"
    | "variant"
    | "category"
    | "currency"
  order_status?: string
  product_id?: string
  variant_id?: string
  category_id?: string
  customer_id?: string
  currency?: string
  limit?: number
  offset?: number
}

export interface MarginMetricSummary {
  currency_code: string
  gross_sales: number
  discounts: number
  tax: number
  shipping: number
  refund_amount: number
  net_sales: number
  cogs: number
  gross_profit: number
  gross_margin_percentage: number
  order_count: number
  items_sold: number
  items_with_missing_cost: number
  orders_with_missing_cost: number
  cancelled_order_amount: number
}

export class MarginReportingService {
  protected readonly knex_: Knex

  constructor(container: any) {
    let resolved: Knex | undefined
    if (typeof container?.resolve === "function") {
      try {
        resolved = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      } catch {
        resolved = undefined
      }
    }
    this.knex_ =
      resolved ||
      container?.[ContainerRegistrationKeys.PG_CONNECTION] ||
      container?.pgConnection
  }

  private parseDate(val?: string | Date, isEnd = false): Date | null {
    if (!val) return null
    if (val instanceof Date) return val

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return isEnd
        ? new Date(`${val}T23:59:59.999Z`)
        : new Date(`${val}T00:00:00.000Z`)
    }
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }

  private buildItemAdjustmentsSubquery(alias: string) {
    return this.knex_("order_line_item_adjustment")
      .select(
        "item_id",
        "version",
        this.knex_.raw("COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as discount_amount")
      )
      .whereNull("deleted_at")
      .groupBy("item_id", "version")
      .as(alias)
  }

  private buildItemTaxRateSubquery(alias: string) {
    return this.knex_("order_line_item_tax_line")
      .select(
        "item_id",
        this.knex_.raw("COALESCE(SUM(CAST(rate AS NUMERIC)), 0) as tax_rate")
      )
      .whereNull("deleted_at")
      .groupBy("item_id")
      .as(alias)
  }

  private buildShippingAdjustmentsSubquery(alias: string) {
    return this.knex_("order_shipping_method_adjustment")
      .select(
        "shipping_method_id",
        "version",
        this.knex_.raw("COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as discount_amount")
      )
      .whereNull("deleted_at")
      .groupBy("shipping_method_id", "version")
      .as(alias)
  }

  private buildOrderShippingSubquery(alias: string, adjAlias = `${alias}_adj`) {
    return this.knex_("order_shipping as os")
      .join("order_shipping_method as osm", "os.shipping_method_id", "osm.id")
      .leftJoin(this.buildShippingAdjustmentsSubquery(adjAlias), function () {
        this.on(`${adjAlias}.shipping_method_id`, "=", "osm.id").andOn(
          `${adjAlias}.version`,
          "=",
          "os.version"
        )
      })
      .select(
        "os.order_id",
        "os.version",
        this.knex_.raw(
          `COALESCE(SUM(GREATEST(0, CAST(osm.amount AS NUMERIC) - COALESCE(CAST(${adjAlias}.discount_amount AS NUMERIC), 0))), 0) as shipping_amount`
        )
      )
      .whereNull("os.deleted_at")
      .whereNull("osm.deleted_at")
      .whereNull("os.return_id")
      .whereNull("os.exchange_id")
      .whereNull("os.claim_id")
      .groupBy("os.order_id", "os.version")
      .as(alias)
  }

  private buildOrderShippingTaxSubquery(alias: string) {
    const taxRateAlias = `${alias}_rate`
    const adjAlias = `${alias}_adj`

    const shippingTaxRateSubquery = this.knex_("order_shipping_method_tax_line")
      .select(
        "shipping_method_id",
        this.knex_.raw("COALESCE(SUM(CAST(rate AS NUMERIC)), 0) as tax_rate")
      )
      .whereNull("deleted_at")
      .groupBy("shipping_method_id")
      .as(taxRateAlias)

    const taxableExpr = `GREATEST(0, CAST(osm.amount AS NUMERIC) - COALESCE(CAST(${adjAlias}.discount_amount AS NUMERIC), 0))`
    const rateExpr = `COALESCE(CAST(${taxRateAlias}.tax_rate AS NUMERIC), 0)`

    return this.knex_("order_shipping as os")
      .join("order_shipping_method as osm", "os.shipping_method_id", "osm.id")
      .join(shippingTaxRateSubquery, `${taxRateAlias}.shipping_method_id`, "osm.id")
      .leftJoin(this.buildShippingAdjustmentsSubquery(adjAlias), function () {
        this.on(`${adjAlias}.shipping_method_id`, "=", "osm.id").andOn(
          `${adjAlias}.version`,
          "=",
          "os.version"
        )
      })
      .select(
        "os.order_id",
        "os.version",
        this.knex_.raw(
          `COALESCE(SUM(CASE WHEN COALESCE(osm.is_tax_inclusive, false) THEN CASE WHEN ${rateExpr} > 0 THEN (${taxableExpr}) * (${rateExpr} / (100 + ${rateExpr})) ELSE 0 END ELSE (${taxableExpr}) * (${rateExpr} / 100.0) END), 0) as shipping_tax_amount`
        ),
        this.knex_.raw(
          `COALESCE(SUM(CASE WHEN COALESCE(osm.is_tax_inclusive, false) THEN 0 ELSE (${taxableExpr}) * (${rateExpr} / 100.0) END), 0) as exclusive_shipping_tax_amount`
        )
      )
      .whereNull("os.deleted_at")
      .whereNull("osm.deleted_at")
      .whereNull("os.return_id")
      .whereNull("os.exchange_id")
      .whereNull("os.claim_id")
      .groupBy("os.order_id", "os.version")
      .as(alias)
  }

  private applyBaseOrderFilters(query: Knex.QueryBuilder, options: MarginReportOptions) {
    query.whereNull("o.deleted_at").where("o.is_draft_order", false)

    if (options.order_status) {
      query.where("o.status", options.order_status)
    }

    if (options.customer_id) {
      query.where("o.customer_id", options.customer_id)
    }

    if (options.currency) {
      query.whereRaw("LOWER(o.currency_code) = ?", [options.currency.toLowerCase()])
    }

    const fromDate = this.parseDate(options.from, false)
    if (fromDate) {
      query.where("o.created_at", ">=", fromDate)
    }

    const toDate = this.parseDate(options.to, true)
    if (toDate) {
      query.where("o.created_at", "<=", toDate)
    }

    if (options.product_id) {
      query.whereExists(function () {
        this.select(1)
          .from("order_item as oi_p")
          .join("order_line_item as oli_p", "oi_p.item_id", "oli_p.id")
          .whereRaw("oi_p.order_id = o.id")
          .whereRaw("oi_p.version = o.version")
          .where("oli_p.product_id", options.product_id)
          .whereNull("oi_p.deleted_at")
          .whereNull("oli_p.deleted_at")
      })
    }

    if (options.variant_id) {
      query.whereExists(function () {
        this.select(1)
          .from("order_item as oi_v")
          .join("order_line_item as oli_v", "oi_v.item_id", "oli_v.id")
          .whereRaw("oi_v.order_id = o.id")
          .whereRaw("oi_v.version = o.version")
          .where("oli_v.variant_id", options.variant_id)
          .whereNull("oi_v.deleted_at")
          .whereNull("oli_v.deleted_at")
      })
    }

    if (options.category_id) {
      query.whereExists(function () {
        this.select(1)
          .from("order_item as oi_c")
          .join("order_line_item as oli_c", "oi_c.item_id", "oli_c.id")
          .join("product_category_product as pcp_c", "oli_c.product_id", "pcp_c.product_id")
          .whereRaw("oi_c.order_id = o.id")
          .whereRaw("oi_c.version = o.version")
          .where("pcp_c.product_category_id", options.category_id)
          .whereNull("oi_c.deleted_at")
          .whereNull("oli_c.deleted_at")
      })
    }
  }

  private safeNumericJsonField(expr: string): string {
    return `CASE WHEN (${expr}) ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN CAST(${expr} AS NUMERIC) ELSE NULL END`
  }

  private getUnitCostExpression(): string {
    return `COALESCE(
      ${this.safeNumericJsonField("oli.metadata->>'raw_cost'")},
      ${this.safeNumericJsonField("oli.metadata->>'cost_price'")},
      ${this.safeNumericJsonField("oli.metadata->>'unit_cost'")},
      ${this.safeNumericJsonField("pv.metadata->>'raw_cost'")},
      ${this.safeNumericJsonField("pv.metadata->>'cost_price'")},
      ${this.safeNumericJsonField("pv.metadata->>'unit_cost'")},
      ${this.safeNumericJsonField("ii.metadata->>'raw_cost'")},
      ${this.safeNumericJsonField("ii.metadata->>'cost_price'")}
    )`
  }

  public async getMarginReport(options: MarginReportOptions = {}) {
    if (!this.knex_) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Database connection is not available for margin reporting"
      )
    }

    const limit = Math.min(options.limit ?? 50, 250)
    const offset = options.offset ?? 0

    // 1. Determine active currencies
    const currencyQuery = this.knex_("order as o")
      .select(this.knex_.raw("LOWER(o.currency_code) as currency_code"))
      .distinct()
    this.applyBaseOrderFilters(currencyQuery, options)

    const currencyRows = await currencyQuery
    const currencies = currencyRows.map((r: any) => r.currency_code).filter(Boolean)

    // 2. Compute Summary Metrics per Currency
    const summaryByCurrency: Record<string, MarginMetricSummary> = {}

    for (const curr of currencies) {
      const currOptions = { ...options, currency: curr }

      const nonCanceledFilter = (q: Knex.QueryBuilder) => {
        this.applyBaseOrderFilters(q, currOptions)
        if (!options.order_status) {
          q.where("o.status", "<>", "canceled")
        }
      }

      // Order count
      const orderCountQuery = this.knex_("order as o").countDistinct("o.id as count")
      nonCanceledFilter(orderCountQuery)
      const orderCountRes = await orderCountQuery.first()
      const orderCount = Number(orderCountRes?.count ?? 0)

      // Line items, Gross Sales, Discounts, COGS, Missing cost tracking
      const unitCostSql = this.getUnitCostExpression()

      const lineItemsQuery = this.knex_("order as o")
        .join("order_item as oi", function () {
          this.on("oi.order_id", "=", "o.id").andOn("oi.version", "=", "o.version")
        })
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin("product_variant as pv", "oli.variant_id", "pv.id")
        .leftJoin("inventory_item as ii", "oli.variant_sku", "ii.sku")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj"), function () {
          this.on("adj.item_id", "=", "oli.id").andOn("adj.version", "=", "oi.version")
        })
        .select(
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as items_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NOT NULL THEN CAST(oi.quantity AS NUMERIC) * ${unitCostSql} ELSE 0 END), 0) as cogs`
          ),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NULL THEN CAST(oi.quantity AS NUMERIC) ELSE 0 END), 0) as items_with_missing_cost`
          ),
          this.knex_.raw(
            `COUNT(DISTINCT CASE WHEN ${unitCostSql} IS NULL THEN o.id ELSE NULL END) as orders_with_missing_cost`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
      nonCanceledFilter(lineItemsQuery)
      const lineItemsRes = await lineItemsQuery.first()

      const itemsSold = Number(lineItemsRes?.items_sold ?? 0)
      const grossSales = Number(lineItemsRes?.gross_sales ?? 0)
      const discounts = Number(lineItemsRes?.discounts ?? 0)
      const cogs = Number(lineItemsRes?.cogs ?? 0)
      const itemsWithMissingCost = Number(lineItemsRes?.items_with_missing_cost ?? 0)
      const ordersWithMissingCost = Number(lineItemsRes?.orders_with_missing_cost ?? 0)

      // Line item taxes via order_line_item_tax_line.rate
      const itemTaxableExpr =
        "GREATEST(0, CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC) - COALESCE(CAST(adj_tax.discount_amount AS NUMERIC), 0))"
      const itemRateExpr = "COALESCE(CAST(itax.tax_rate AS NUMERIC), 0)"

      const itemTaxQuery = this.knex_("order as o")
        .join("order_item as oi", function () {
          this.on("oi.order_id", "=", "o.id").andOn("oi.version", "=", "o.version")
        })
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj_tax"), function () {
          this.on("adj_tax.item_id", "=", "oli.id").andOn(
            "adj_tax.version",
            "=",
            "oi.version"
          )
        })
        .join(this.buildItemTaxRateSubquery("itax"), "itax.item_id", "oli.id")
        .select(
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN COALESCE(oli.is_tax_inclusive, false) THEN CASE WHEN ${itemRateExpr} > 0 THEN (${itemTaxableExpr}) * (${itemRateExpr} / (100 + ${itemRateExpr})) ELSE 0 END ELSE (${itemTaxableExpr}) * (${itemRateExpr} / 100.0) END), 0) as item_tax`
          ),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN COALESCE(oli.is_tax_inclusive, false) THEN 0 ELSE (${itemTaxableExpr}) * (${itemRateExpr} / 100.0) END), 0) as exclusive_item_tax`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
      nonCanceledFilter(itemTaxQuery)
      const itemTaxRes = await itemTaxQuery.first()
      const itemTax = Number(itemTaxRes?.item_tax ?? 0)
      const addedItemTax =
        itemTaxRes?.exclusive_item_tax !== undefined
          ? Number(itemTaxRes.exclusive_item_tax)
          : itemTax

      // Shipping revenue via order_shipping -> order_shipping_method
      const shippingQuery = this.knex_("order as o")
        .leftJoin(this.buildOrderShippingSubquery("ship"), function () {
          this.on("ship.order_id", "=", "o.id").andOn("ship.version", "=", "o.version")
        })
        .select(
          this.knex_.raw("COALESCE(SUM(CAST(ship.shipping_amount AS NUMERIC)), 0) as shipping")
        )
      nonCanceledFilter(shippingQuery)
      const shippingRes = await shippingQuery.first()
      const shipping = Number(shippingRes?.shipping ?? 0)

      // Shipping tax via order_shipping -> order_shipping_method -> order_shipping_method_tax_line.rate
      const shippingTaxQuery = this.knex_("order as o")
        .leftJoin(this.buildOrderShippingTaxSubquery("shiptax"), function () {
          this.on("shiptax.order_id", "=", "o.id").andOn("shiptax.version", "=", "o.version")
        })
        .select(
          this.knex_.raw(
            "COALESCE(SUM(CAST(shiptax.shipping_tax_amount AS NUMERIC)), 0) as shipping_tax"
          ),
          this.knex_.raw(
            "COALESCE(SUM(CAST(shiptax.exclusive_shipping_tax_amount AS NUMERIC)), 0) as exclusive_shipping_tax"
          )
        )
      nonCanceledFilter(shippingTaxQuery)
      const shippingTaxRes = await shippingTaxQuery.first()
      const shippingTax = Number(shippingTaxRes?.shipping_tax ?? 0)
      const addedShippingTax =
        shippingTaxRes?.exclusive_shipping_tax !== undefined
          ? Number(shippingTaxRes.exclusive_shipping_tax)
          : shippingTax

      const tax = itemTax + shippingTax
      const addedTax = addedItemTax + addedShippingTax

      // Refunds
      const refundQuery = this.knex_("order as o")
        .join("order_transaction as ot", "ot.order_id", "o.id")
        .select(
          this.knex_.raw(
            "COALESCE(SUM(ABS(CAST(ot.amount AS NUMERIC))), 0) as refund_amount"
          )
        )
        .where("ot.amount", "<", 0)
        .whereNull("ot.deleted_at")
      nonCanceledFilter(refundQuery)
      const refundRes = await refundQuery.first()
      const refundAmount = Number(refundRes?.refund_amount ?? 0)

      // Cancelled order amount
      const canceledQuery = this.knex_("order as o")
        .leftJoin("order_item as oi", function () {
          this.on("oi.order_id", "=", "o.id")
            .andOn("oi.version", "=", "o.version")
            .andOnNull("oi.deleted_at")
        })
        .leftJoin("order_line_item as oli", function () {
          this.on("oi.item_id", "=", "oli.id").andOnNull("oli.deleted_at")
        })
        .select(
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as cancelled_amount"
          )
        )
        .where("o.status", "canceled")
      this.applyBaseOrderFilters(canceledQuery, currOptions)
      const canceledRes = await canceledQuery.first()
      const cancelledOrderAmount = Number(canceledRes?.cancelled_amount ?? 0)

      const netSales = grossSales - discounts + addedTax + shipping - refundAmount
      const grossProfit = netSales - cogs
      const grossMarginPercentage =
        netSales !== 0 ? Number(((grossProfit / netSales) * 100).toFixed(2)) : 0

      summaryByCurrency[curr] = {
        currency_code: curr,
        gross_sales: Number(grossSales.toFixed(2)),
        discounts: Number(discounts.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        refund_amount: Number(refundAmount.toFixed(2)),
        net_sales: Number(netSales.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        gross_profit: Number(grossProfit.toFixed(2)),
        gross_margin_percentage: grossMarginPercentage,
        order_count: orderCount,
        items_sold: itemsSold,
        items_with_missing_cost: itemsWithMissingCost,
        orders_with_missing_cost: ordersWithMissingCost,
        cancelled_order_amount: Number(cancelledOrderAmount.toFixed(2)),
      }
    }

    let summary: MarginMetricSummary | null = null
    if (currencies.length === 1) {
      summary = summaryByCurrency[currencies[0]]
    } else if (options.currency && summaryByCurrency[options.currency.toLowerCase()]) {
      summary = summaryByCurrency[options.currency.toLowerCase()]
    } else if (currencies.length === 0) {
      const fallbackCurr = options.currency?.toLowerCase() || "irr"
      summary = {
        currency_code: fallbackCurr,
        gross_sales: 0,
        discounts: 0,
        tax: 0,
        shipping: 0,
        refund_amount: 0,
        net_sales: 0,
        cogs: 0,
        gross_profit: 0,
        gross_margin_percentage: 0,
        order_count: 0,
        items_sold: 0,
        items_with_missing_cost: 0,
        orders_with_missing_cost: 0,
        cancelled_order_amount: 0,
      }
    }

    let breakdown: any[] = []
    let breakdownCount = 0

    if (options.group_by) {
      const res = await this.getBreakdown(options, limit, offset)
      breakdown = res.rows
      breakdownCount = res.count
    }

    return {
      currencies,
      summary,
      summary_by_currency: currencies.length > 1 ? summaryByCurrency : undefined,
      breakdown,
      count: breakdownCount,
      limit,
      offset,
    }
  }

  private async getBreakdown(
    options: MarginReportOptions,
    limit: number,
    offset: number
  ) {
    const groupBy = options.group_by
    const unitCostSql = this.getUnitCostExpression()

    if (
      groupBy === "day" ||
      groupBy === "week" ||
      groupBy === "month" ||
      groupBy === "year"
    ) {
      const dateTrunc =
        groupBy === "day"
          ? "day"
          : groupBy === "week"
            ? "week"
            : groupBy === "month"
              ? "month"
              : "year"
      const dateExpr = `DATE_TRUNC('${dateTrunc}', o.created_at)`

      const orderItemsAgg = this.knex_("order_item as oi")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin("product_variant as pv", "oli.variant_id", "pv.id")
        .leftJoin("inventory_item as ii", "oli.variant_sku", "ii.sku")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj_sub"), function () {
          this.on("adj_sub.item_id", "=", "oli.id").andOn(
            "adj_sub.version",
            "=",
            "oi.version"
          )
        })
        .select(
          "oi.order_id",
          "oi.version",
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as items_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj_sub.discount_amount AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NOT NULL THEN CAST(oi.quantity AS NUMERIC) * ${unitCostSql} ELSE 0 END), 0) as cogs`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oi.order_id", "oi.version")
        .as("oitem_agg")

      const baseQuery = this.knex_("order as o")
        .leftJoin(orderItemsAgg, function () {
          this.on("oitem_agg.order_id", "=", "o.id").andOn(
            "oitem_agg.version",
            "=",
            "o.version"
          )
        })
        .leftJoin(this.buildOrderShippingSubquery("oship_agg"), function () {
          this.on("oship_agg.order_id", "=", "o.id").andOn(
            "oship_agg.version",
            "=",
            "o.version"
          )
        })
        .select(
          this.knex_.raw(`TO_CHAR(${dateExpr}, 'YYYY-MM-DD') as date`),
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.items_sold AS NUMERIC)), 0) as items_sold"),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.gross_sales AS NUMERIC)), 0) as gross_sales"),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.discounts AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oship_agg.shipping_amount AS NUMERIC)), 0) as shipping"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.cogs AS NUMERIC)), 0) as cogs")
        )
        .groupByRaw(`${dateExpr}`)
        .orderByRaw(`${dateExpr} ASC`)

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const rows = await baseQuery
      const formatted = rows.map((r: any) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const ship = Number(r.shipping || 0)
        const net = gross - disc + ship
        const cogsVal = Number(r.cogs || 0)
        const profit = net - cogsVal
        const marginPct = net !== 0 ? Number(((profit / net) * 100).toFixed(2)) : 0

        return {
          date: r.date,
          orders: Number(r.orders || 0),
          items_sold: Number(r.items_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          shipping: Number(ship.toFixed(2)),
          net_sales: Number(net.toFixed(2)),
          cogs: Number(cogsVal.toFixed(2)),
          gross_profit: Number(profit.toFixed(2)),
          gross_margin_percentage: marginPct,
        }
      })

      return { rows: formatted.slice(offset, offset + limit), count: formatted.length }
    }

    if (groupBy === "product") {
      const baseQuery = this.knex_("order_line_item as oli")
        .join("order_item as oi", "oi.item_id", "oli.id")
        .join("order as o", function () {
          this.on("oi.order_id", "=", "o.id").andOn("oi.version", "=", "o.version")
        })
        .leftJoin("product_variant as pv", "oli.variant_id", "pv.id")
        .leftJoin("inventory_item as ii", "oli.variant_sku", "ii.sku")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj"), function () {
          this.on("adj.item_id", "=", "oli.id").andOn("adj.version", "=", "oi.version")
        })
        .select(
          "oli.product_id",
          "oli.product_title",
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as units_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NOT NULL THEN CAST(oi.quantity AS NUMERIC) * ${unitCostSql} ELSE 0 END), 0) as cogs`
          ),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NULL THEN CAST(oi.quantity AS NUMERIC) ELSE 0 END), 0) as items_with_missing_cost`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oli.product_id", "oli.product_title")
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const countQuery = this.knex_
        .from(baseQuery.clone().clearOrder().as("sub"))
        .count("* as count")
        .first()
      const countRes = await countQuery
      const totalCount = Number(countRes?.count ?? 0)

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r: any) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const net = gross - disc
        const cogsVal = Number(r.cogs || 0)
        const profit = net - cogsVal
        const marginPct = net !== 0 ? Number(((profit / net) * 100).toFixed(2)) : 0

        return {
          product_id: r.product_id,
          product_title: r.product_title || "Unknown Product",
          units_sold: Number(r.units_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number(net.toFixed(2)),
          cogs: Number(cogsVal.toFixed(2)),
          gross_profit: Number(profit.toFixed(2)),
          gross_margin_percentage: marginPct,
          items_with_missing_cost: Number(r.items_with_missing_cost || 0),
        }
      })

      return { rows: formatted, count: totalCount }
    }

    if (groupBy === "variant") {
      const baseQuery = this.knex_("order_line_item as oli")
        .join("order_item as oi", "oi.item_id", "oli.id")
        .join("order as o", function () {
          this.on("oi.order_id", "=", "o.id").andOn("oi.version", "=", "o.version")
        })
        .leftJoin("product_variant as pv", "oli.variant_id", "pv.id")
        .leftJoin("inventory_item as ii", "oli.variant_sku", "ii.sku")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj"), function () {
          this.on("adj.item_id", "=", "oli.id").andOn("adj.version", "=", "oi.version")
        })
        .select(
          "oli.variant_id",
          "oli.variant_sku",
          "oli.variant_title",
          "oli.product_id",
          "oli.product_title",
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as units_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NOT NULL THEN CAST(oi.quantity AS NUMERIC) * ${unitCostSql} ELSE 0 END), 0) as cogs`
          ),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NULL THEN CAST(oi.quantity AS NUMERIC) ELSE 0 END), 0) as items_with_missing_cost`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy(
          "oli.variant_id",
          "oli.variant_sku",
          "oli.variant_title",
          "oli.product_id",
          "oli.product_title"
        )
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const countQuery = this.knex_
        .from(baseQuery.clone().clearOrder().as("sub"))
        .count("* as count")
        .first()
      const countRes = await countQuery
      const totalCount = Number(countRes?.count ?? 0)

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r: any) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const net = gross - disc
        const cogsVal = Number(r.cogs || 0)
        const profit = net - cogsVal
        const marginPct = net !== 0 ? Number(((profit / net) * 100).toFixed(2)) : 0

        return {
          variant_id: r.variant_id,
          variant_sku: r.variant_sku || "",
          variant_title: r.variant_title || "Default Variant",
          product_id: r.product_id,
          product_title: r.product_title || "Unknown Product",
          units_sold: Number(r.units_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number(net.toFixed(2)),
          cogs: Number(cogsVal.toFixed(2)),
          gross_profit: Number(profit.toFixed(2)),
          gross_margin_percentage: marginPct,
          items_with_missing_cost: Number(r.items_with_missing_cost || 0),
        }
      })

      return { rows: formatted, count: totalCount }
    }

    if (groupBy === "category") {
      const baseQuery = this.knex_("product_category as pc")
        .join("product_category_product as pcp", "pcp.product_category_id", "pc.id")
        .join("order_line_item as oli", "oli.product_id", "pcp.product_id")
        .join("order_item as oi", "oi.item_id", "oli.id")
        .join("order as o", function () {
          this.on("oi.order_id", "=", "o.id").andOn("oi.version", "=", "o.version")
        })
        .leftJoin("product_variant as pv", "oli.variant_id", "pv.id")
        .leftJoin("inventory_item as ii", "oli.variant_sku", "ii.sku")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj"), function () {
          this.on("adj.item_id", "=", "oli.id").andOn("adj.version", "=", "oi.version")
        })
        .select(
          "pc.id as category_id",
          "pc.name as category_name",
          "pc.handle as category_handle",
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as units_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NOT NULL THEN CAST(oi.quantity AS NUMERIC) * ${unitCostSql} ELSE 0 END), 0) as cogs`
          ),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NULL THEN CAST(oi.quantity AS NUMERIC) ELSE 0 END), 0) as items_with_missing_cost`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .whereNull("pc.deleted_at")
        .groupBy("pc.id", "pc.name", "pc.handle")
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const countQuery = this.knex_
        .from(baseQuery.clone().clearOrder().as("sub"))
        .count("* as count")
        .first()
      const countRes = await countQuery
      const totalCount = Number(countRes?.count ?? 0)

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r: any) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const net = gross - disc
        const cogsVal = Number(r.cogs || 0)
        const profit = net - cogsVal
        const marginPct = net !== 0 ? Number(((profit / net) * 100).toFixed(2)) : 0

        return {
          category_id: r.category_id,
          category_name: r.category_name,
          category_handle: r.category_handle,
          orders: Number(r.orders || 0),
          units_sold: Number(r.units_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number(net.toFixed(2)),
          cogs: Number(cogsVal.toFixed(2)),
          gross_profit: Number(profit.toFixed(2)),
          gross_margin_percentage: marginPct,
          items_with_missing_cost: Number(r.items_with_missing_cost || 0),
        }
      })

      return { rows: formatted, count: totalCount }
    }

    if (groupBy === "currency") {
      const orderSalesAgg = this.knex_("order_item as oi")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin("product_variant as pv", "oli.variant_id", "pv.id")
        .leftJoin("inventory_item as ii", "oli.variant_sku", "ii.sku")
        .leftJoin(this.buildItemAdjustmentsSubquery("adj_curr"), function () {
          this.on("adj_curr.item_id", "=", "oli.id").andOn(
            "adj_curr.version",
            "=",
            "oi.version"
          )
        })
        .select(
          "oi.order_id",
          "oi.version",
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj_curr.discount_amount AS NUMERIC)), 0) as discounts"),
          this.knex_.raw(
            `COALESCE(SUM(CASE WHEN ${unitCostSql} IS NOT NULL THEN CAST(oi.quantity AS NUMERIC) * ${unitCostSql} ELSE 0 END), 0) as cogs`
          )
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oi.order_id", "oi.version")
        .as("osales_curr")

      const baseQuery = this.knex_("order as o")
        .leftJoin(orderSalesAgg, function () {
          this.on("osales_curr.order_id", "=", "o.id").andOn(
            "osales_curr.version",
            "=",
            "o.version"
          )
        })
        .leftJoin(this.buildOrderShippingSubquery("oship_curr"), function () {
          this.on("oship_curr.order_id", "=", "o.id").andOn(
            "oship_curr.version",
            "=",
            "o.version"
          )
        })
        .select(
          this.knex_.raw("LOWER(o.currency_code) as currency_code"),
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(osales_curr.gross_sales AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw(
            "COALESCE(SUM(CAST(osales_curr.discounts AS NUMERIC)), 0) as discounts"
          ),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oship_curr.shipping_amount AS NUMERIC)), 0) as shipping"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(osales_curr.cogs AS NUMERIC)), 0) as cogs")
        )
        .groupByRaw("LOWER(o.currency_code)")
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r: any) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const ship = Number(r.shipping || 0)
        const net = gross - disc + ship
        const cogsVal = Number(r.cogs || 0)
        const profit = net - cogsVal
        const marginPct = net !== 0 ? Number(((profit / net) * 100).toFixed(2)) : 0

        return {
          currency_code: r.currency_code,
          orders: Number(r.orders || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          shipping: Number(ship.toFixed(2)),
          net_sales: Number(net.toFixed(2)),
          cogs: Number(cogsVal.toFixed(2)),
          gross_profit: Number(profit.toFixed(2)),
          gross_margin_percentage: marginPct,
        }
      })

      return { rows: formatted, count: formatted.length }
    }

    return { rows: [], count: 0 }
  }
}
