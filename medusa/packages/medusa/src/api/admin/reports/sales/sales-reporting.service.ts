import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Knex } from "knex"

export interface SalesReportOptions {
  from?: string | Date
  to?: string | Date
  group_by?: "day" | "week" | "month" | "product" | "variant" | "category" | "payment_method" | "currency"
  order_status?: string
  product_id?: string
  variant_id?: string
  category_id?: string
  customer_id?: string
  currency?: string
  payment_method?: string
  limit?: number
  offset?: number
}

export interface MetricSummary {
  currency_code: string
  gross_sales: number
  discounts: number
  tax: number
  shipping: number
  refund_amount: number
  net_sales: number
  order_count: number
  items_sold: number
  average_order_value: number
  cancelled_order_amount: number
}

export class SalesReportingService {
  protected readonly knex_: Knex

  constructor(container: any) {
    this.knex_ = container[ContainerRegistrationKeys.PG_CONNECTION] || container.pgConnection
  }

  private parseDate(val?: string | Date, isEnd = false): Date | null {
    if (!val) return null
    if (val instanceof Date) return val

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return isEnd ? new Date(`${val}T23:59:59.999Z`) : new Date(`${val}T00:00:00.000Z`)
    }
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }

  private applyBaseOrderFilters(query: Knex.QueryBuilder, options: SalesReportOptions) {
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
          .where("pcp_c.product_category_id", options.category_id)
          .whereNull("oi_c.deleted_at")
          .whereNull("oli_c.deleted_at")
      })
    }

    if (options.payment_method) {
      query.whereExists(function () {
        this.select(1)
          .from("order_payment_collection as opc_pm")
          .join("payment_collection as pcol_pm", "opc_pm.payment_collection_id", "pcol_pm.id")
          .join("payment as p_pm", "pcol_pm.id", "p_pm.payment_collection_id")
          .whereRaw("opc_pm.order_id = o.id")
          .where("p_pm.provider_id", options.payment_method)
      })
    }
  }

  public async getSalesReport(options: SalesReportOptions = {}) {
    const limit = Math.min(options.limit ?? 50, 250)
    const offset = options.offset ?? 0

    // 1. Determine active currencies present in dataset
    const currencyQuery = this.knex_("order as o").select(
      this.knex_.raw("LOWER(o.currency_code) as currency_code")
    ).distinct()
    this.applyBaseOrderFilters(currencyQuery, options)

    const currencyRows = await currencyQuery
    const currencies = currencyRows.map((r: any) => r.currency_code).filter(Boolean)

    // 2. Compute Summary Metrics per Currency
    const summaryByCurrency: Record<string, MetricSummary> = {}

    for (const curr of currencies) {
      const currOptions = { ...options, currency: curr }

      const nonCanceledFilter = (q: Knex.QueryBuilder) => {
        this.applyBaseOrderFilters(q, currOptions)
        if (!options.order_status) {
          q.where("o.status", "<>", "canceled")
        }
      }

      // Subquery for line item adjustments (pre-aggregated to prevent fan-out)
      const adjustmentsSubquery = this.knex_("order_line_item_adjustment")
        .select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount"))
        .whereNull("deleted_at")
        .groupBy("item_id")
        .as("adj")

      // Subquery for line item taxes (pre-aggregated)
      const itemTaxSubquery = this.knex_("order_line_item_tax_line")
        .select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as tax_amount"))
        .whereNull("deleted_at")
        .groupBy("item_id")
        .as("itax")

      // Order count
      const orderCountQuery = this.knex_("order as o").countDistinct("o.id as count")
      nonCanceledFilter(orderCountQuery)
      const orderCountRes = await orderCountQuery.first()
      const orderCount = Number(orderCountRes?.count ?? 0)

      // Items, Gross Sales, Discounts
      const lineItemsQuery = this.knex_("order as o")
        .join("order_item as oi", "oi.order_id", "o.id")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin(adjustmentsSubquery, "adj.item_id", "oli.id")
        .select(
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as items_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts")
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
      nonCanceledFilter(lineItemsQuery)
      const lineItemsRes = await lineItemsQuery.first()

      const itemsSold = Number(lineItemsRes?.items_sold ?? 0)
      const grossSales = Number(lineItemsRes?.gross_sales ?? 0)
      const discounts = Number(lineItemsRes?.discounts ?? 0)

      // Line item tax
      const itemTaxQuery = this.knex_("order as o")
        .join("order_item as oi", "oi.order_id", "o.id")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .join(itemTaxSubquery, "itax.item_id", "oli.id")
        .select(this.knex_.raw("COALESCE(SUM(CAST(itax.tax_amount AS NUMERIC)), 0) as item_tax"))
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
      nonCanceledFilter(itemTaxQuery)
      const itemTaxRes = await itemTaxQuery.first()
      const itemTax = Number(itemTaxRes?.item_tax ?? 0)

      // Shipping revenue & tax (pre-aggregated per shipping method / order)
      const shippingSubquery = this.knex_("order_shipping_method")
        .select("order_id", this.knex_.raw("COALESCE(SUM(amount), 0) as shipping_amount"))
        .whereNull("deleted_at")
        .groupBy("order_id")
        .as("ship")

      const shippingQuery = this.knex_("order as o")
        .leftJoin(shippingSubquery, "ship.order_id", "o.id")
        .select(this.knex_.raw("COALESCE(SUM(CAST(ship.shipping_amount AS NUMERIC)), 0) as shipping"))
      nonCanceledFilter(shippingQuery)
      const shippingRes = await shippingQuery.first()
      const shipping = Number(shippingRes?.shipping ?? 0)

      const shippingTaxSubquery = this.knex_("order_shipping_method_tax_line as osmtl")
        .join("order_shipping_method as osm", "osmtl.shipping_method_id", "osm.id")
        .select("osm.order_id", this.knex_.raw("COALESCE(SUM(osmtl.amount), 0) as shipping_tax_amount"))
        .whereNull("osm.deleted_at")
        .whereNull("osmtl.deleted_at")
        .groupBy("osm.order_id")
        .as("shiptax")

      const shippingTaxQuery = this.knex_("order as o")
        .leftJoin(shippingTaxSubquery, "shiptax.order_id", "o.id")
        .select(this.knex_.raw("COALESCE(SUM(CAST(shiptax.shipping_tax_amount AS NUMERIC)), 0) as shipping_tax"))
      nonCanceledFilter(shippingTaxQuery)
      const shippingTaxRes = await shippingTaxQuery.first()
      const shippingTax = Number(shippingTaxRes?.shipping_tax ?? 0)

      const tax = itemTax + shippingTax

      // Refund transactions
      const refundQuery = this.knex_("order as o")
        .join("order_transaction as ot", "ot.order_id", "o.id")
        .select(this.knex_.raw("COALESCE(SUM(ABS(CAST(ot.amount AS NUMERIC))), 0) as refund_amount"))
        .where("ot.amount", "<", 0)
        .whereNull("ot.deleted_at")
      nonCanceledFilter(refundQuery)
      const refundRes = await refundQuery.first()
      const refundAmount = Number(refundRes?.refund_amount ?? 0)

      // Cancelled order amount
      const canceledQuery = this.knex_("order as o")
        .leftJoin("order_item as oi", "oi.order_id", "o.id")
        .leftJoin("order_line_item as oli", "oi.item_id", "oli.id")
        .select(
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as cancelled_amount"
          )
        )
        .where("o.status", "canceled")
      this.applyBaseOrderFilters(canceledQuery, currOptions)
      const canceledRes = await canceledQuery.first()
      const cancelledOrderAmount = Number(canceledRes?.cancelled_amount ?? 0)

      const netSales = grossSales - discounts + tax + shipping - refundAmount
      const averageOrderValue = orderCount > 0 ? Number((netSales / orderCount).toFixed(2)) : 0

      summaryByCurrency[curr] = {
        currency_code: curr,
        gross_sales: Number(grossSales.toFixed(2)),
        discounts: Number(discounts.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        refund_amount: Number(refundAmount.toFixed(2)),
        net_sales: Number(netSales.toFixed(2)),
        order_count: orderCount,
        items_sold: itemsSold,
        average_order_value: averageOrderValue,
        cancelled_order_amount: Number(cancelledOrderAmount.toFixed(2)),
      }
    }

    let summary: MetricSummary | null = null
    if (currencies.length === 1) {
      summary = summaryByCurrency[currencies[0]]
    } else if (options.currency && summaryByCurrency[options.currency.toLowerCase()]) {
      summary = summaryByCurrency[options.currency.toLowerCase()]
    } else if (currencies.length === 0) {
      const fallbackCurr = options.currency?.toLowerCase() || "usd"
      summary = {
        currency_code: fallbackCurr,
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

  private async getBreakdown(options: SalesReportOptions, limit: number, offset: number) {
    const groupBy = options.group_by

    if (groupBy === "day" || groupBy === "week" || groupBy === "month") {
      const dateTrunc = groupBy === "day" ? "day" : groupBy === "week" ? "week" : "month"
      const dateExpr = `DATE_TRUNC('${dateTrunc}', o.created_at)`

      const orderItemsAgg = this.knex_("order_item as oi")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin(
          this.knex_("order_line_item_adjustment").select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount")).whereNull("deleted_at").groupBy("item_id").as("adj_sub"),
          "adj_sub.item_id",
          "oli.id"
        )
        .select(
          "oi.order_id",
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as items_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj_sub.discount_amount AS NUMERIC)), 0) as discounts")
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oi.order_id")
        .as("oitem_agg")

      const orderShippingAgg = this.knex_("order_shipping_method")
        .select("order_id", this.knex_.raw("COALESCE(SUM(amount), 0) as shipping"))
        .whereNull("deleted_at")
        .groupBy("order_id")
        .as("oship_agg")

      const baseQuery = this.knex_("order as o")
        .leftJoin(orderItemsAgg, "oitem_agg.order_id", "o.id")
        .leftJoin(orderShippingAgg, "oship_agg.order_id", "o.id")
        .select(
          this.knex_.raw(`TO_CHAR(${dateExpr}, 'YYYY-MM-DD') as date`),
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.items_sold AS NUMERIC)), 0) as items_sold"),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.gross_sales AS NUMERIC)), 0) as gross_sales"),
          this.knex_.raw("COALESCE(SUM(CAST(oitem_agg.discounts AS NUMERIC)), 0) as discounts"),
          this.knex_.raw("COALESCE(SUM(CAST(oship_agg.shipping AS NUMERIC)), 0) as shipping")
        )
        .groupByRaw(`${dateExpr}`)
        .orderByRaw(`${dateExpr} ASC`)

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const rows = await baseQuery
      const formatted = rows.map((r) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const ship = Number(r.shipping || 0)
        const net = gross - disc + ship
        return {
          date: r.date,
          orders: Number(r.orders || 0),
          items_sold: Number(r.items_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          shipping: Number(ship.toFixed(2)),
          net_sales: Number(net.toFixed(2)),
        }
      })

      return { rows: formatted.slice(offset, offset + limit), count: formatted.length }
    }

    if (groupBy === "product") {
      const adjustmentsSubquery = this.knex_("order_line_item_adjustment")
        .select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount"))
        .whereNull("deleted_at")
        .groupBy("item_id")
        .as("adj")

      const baseQuery = this.knex_("order_line_item as oli")
        .join("order_item as oi", "oi.item_id", "oli.id")
        .join("order as o", "oi.order_id", "o.id")
        .leftJoin(adjustmentsSubquery, "adj.item_id", "oli.id")
        .select(
          "oli.product_id",
          "oli.product_title",
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as units_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts")
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oli.product_id", "oli.product_title")
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const countQuery = this.knex_.from(baseQuery.clone().as("sub")).count("* as count").first()
      const countRes = await countQuery
      const totalCount = Number(countRes?.count ?? 0)

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        return {
          product_id: r.product_id,
          product_title: r.product_title || "Unknown Product",
          units_sold: Number(r.units_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number((gross - disc).toFixed(2)),
        }
      })

      return { rows: formatted, count: totalCount }
    }

    if (groupBy === "variant") {
      const adjustmentsSubquery = this.knex_("order_line_item_adjustment")
        .select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount"))
        .whereNull("deleted_at")
        .groupBy("item_id")
        .as("adj")

      const baseQuery = this.knex_("order_line_item as oli")
        .join("order_item as oi", "oi.item_id", "oli.id")
        .join("order as o", "oi.order_id", "o.id")
        .leftJoin(adjustmentsSubquery, "adj.item_id", "oli.id")
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
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts")
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

      const countQuery = this.knex_.from(baseQuery.clone().as("sub")).count("* as count").first()
      const countRes = await countQuery
      const totalCount = Number(countRes?.count ?? 0)

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        return {
          variant_id: r.variant_id,
          variant_sku: r.variant_sku || "",
          variant_title: r.variant_title || "Default Variant",
          product_id: r.product_id,
          product_title: r.product_title || "Unknown Product",
          units_sold: Number(r.units_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number((gross - disc).toFixed(2)),
        }
      })

      return { rows: formatted, count: totalCount }
    }

    if (groupBy === "category") {
      const adjustmentsSubquery = this.knex_("order_line_item_adjustment")
        .select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount"))
        .whereNull("deleted_at")
        .groupBy("item_id")
        .as("adj")

      const baseQuery = this.knex_("product_category as pc")
        .join("product_category_product as pcp", "pcp.product_category_id", "pc.id")
        .join("order_line_item as oli", "oli.product_id", "pcp.product_id")
        .join("order_item as oi", "oi.item_id", "oli.id")
        .join("order as o", "oi.order_id", "o.id")
        .leftJoin(adjustmentsSubquery, "adj.item_id", "oli.id")
        .select(
          "pc.id as category_id",
          "pc.name as category_name",
          "pc.handle as category_handle",
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw("COALESCE(SUM(CAST(oi.quantity AS NUMERIC)), 0) as units_sold"),
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj.discount_amount AS NUMERIC)), 0) as discounts")
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

      const countQuery = this.knex_.from(baseQuery.clone().as("sub")).count("* as count").first()
      const countRes = await countQuery
      const totalCount = Number(countRes?.count ?? 0)

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        return {
          category_id: r.category_id,
          category_name: r.category_name,
          category_handle: r.category_handle,
          orders: Number(r.orders || 0),
          units_sold: Number(r.units_sold || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number((gross - disc).toFixed(2)),
        }
      })

      return { rows: formatted, count: totalCount }
    }

    if (groupBy === "payment_method") {
      const orderSalesAgg = this.knex_("order_item as oi")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin(
          this.knex_("order_line_item_adjustment").select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount")).whereNull("deleted_at").groupBy("item_id").as("adj_pm"),
          "adj_pm.item_id",
          "oli.id"
        )
        .select(
          "oi.order_id",
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj_pm.discount_amount AS NUMERIC)), 0) as discounts")
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oi.order_id")
        .as("osales_pm")

      const baseQuery = this.knex_("order as o")
        .join("order_payment_collection as opc", "opc.order_id", "o.id")
        .join("payment_collection as pcol", "opc.payment_collection_id", "pcol.id")
        .join("payment as p", "pcol.id", "p.payment_collection_id")
        .leftJoin(orderSalesAgg, "osales_pm.order_id", "o.id")
        .select(
          "p.provider_id as payment_method",
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw("COUNT(DISTINCT p.id) as transactions"),
          this.knex_.raw("COALESCE(SUM(CAST(osales_pm.gross_sales AS NUMERIC)), 0) as gross_sales"),
          this.knex_.raw("COALESCE(SUM(CAST(osales_pm.discounts AS NUMERIC)), 0) as discounts")
        )
        .groupBy("p.provider_id")
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        return {
          payment_method: r.payment_method,
          orders: Number(r.orders || 0),
          transactions: Number(r.transactions || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          net_sales: Number((gross - disc).toFixed(2)),
        }
      })

      return { rows: formatted, count: formatted.length }
    }

    if (groupBy === "currency") {
      const orderSalesAgg = this.knex_("order_item as oi")
        .join("order_line_item as oli", "oi.item_id", "oli.id")
        .leftJoin(
          this.knex_("order_line_item_adjustment").select("item_id", this.knex_.raw("COALESCE(SUM(amount), 0) as discount_amount")).whereNull("deleted_at").groupBy("item_id").as("adj_curr"),
          "adj_curr.item_id",
          "oli.id"
        )
        .select(
          "oi.order_id",
          this.knex_.raw(
            "COALESCE(SUM(CAST(oi.quantity AS NUMERIC) * CAST(COALESCE(oi.unit_price, oli.unit_price, 0) AS NUMERIC)), 0) as gross_sales"
          ),
          this.knex_.raw("COALESCE(SUM(CAST(adj_curr.discount_amount AS NUMERIC)), 0) as discounts")
        )
        .whereNull("oi.deleted_at")
        .whereNull("oli.deleted_at")
        .groupBy("oi.order_id")
        .as("osales_curr")

      const orderShippingAgg = this.knex_("order_shipping_method")
        .select("order_id", this.knex_.raw("COALESCE(SUM(amount), 0) as shipping"))
        .whereNull("deleted_at")
        .groupBy("order_id")
        .as("oship_curr")

      const baseQuery = this.knex_("order as o")
        .leftJoin(orderSalesAgg, "osales_curr.order_id", "o.id")
        .leftJoin(orderShippingAgg, "oship_curr.order_id", "o.id")
        .select(
          this.knex_.raw("LOWER(o.currency_code) as currency_code"),
          this.knex_.raw("COUNT(DISTINCT o.id) as orders"),
          this.knex_.raw("COALESCE(SUM(CAST(osales_curr.gross_sales AS NUMERIC)), 0) as gross_sales"),
          this.knex_.raw("COALESCE(SUM(CAST(osales_curr.discounts AS NUMERIC)), 0) as discounts"),
          this.knex_.raw("COALESCE(SUM(CAST(oship_curr.shipping AS NUMERIC)), 0) as shipping")
        )
        .groupByRaw("LOWER(o.currency_code)")
        .orderByRaw("gross_sales DESC")

      this.applyBaseOrderFilters(baseQuery, options)
      if (!options.order_status) {
        baseQuery.where("o.status", "<>", "canceled")
      }

      const rows = await baseQuery.limit(limit).offset(offset)
      const formatted = rows.map((r) => {
        const gross = Number(r.gross_sales || 0)
        const disc = Number(r.discounts || 0)
        const ship = Number(r.shipping || 0)
        return {
          currency_code: r.currency_code,
          orders: Number(r.orders || 0),
          gross_sales: Number(gross.toFixed(2)),
          discounts: Number(disc.toFixed(2)),
          shipping: Number(ship.toFixed(2)),
          net_sales: Number((gross - disc + ship).toFixed(2)),
        }
      })

      return { rows: formatted, count: formatted.length }
    }

    return { rows: [], count: 0 }
  }
}
