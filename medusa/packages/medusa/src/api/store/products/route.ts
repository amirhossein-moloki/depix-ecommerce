import { MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, QueryContextType } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  isPresent,
  QueryContext,
} from "@medusajs/framework/utils"
import IndexEngineFeatureFlag from "../../../feature-flags/index-engine"
import {
  prepareInventoryQuantityFields,
  wrapVariantsWithInventoryQuantityForSalesChannel,
  wrapVariantsWithTotalInventoryQuantity,
} from "../../utils/middlewares"
import {
  enrichProductsWithBrand,
  ensureMetadataInFields,
} from "../../utils/enrich-products-with-brand"
import {
  buildCandidateFields,
  CatalogFilterParams,
  extractCatalogFilterParams,
  filterCatalogProducts,
  sortCatalogProducts,
} from "./catalog-filters"
import {
  applyActiveAutomaticPromotionsToProducts,
  enrichProductsWithStoreSummary,
  RequestWithContext,
  wrapProductsWithTaxPrices,
} from "./helpers"

export const GET = async (
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>
) => {
  const { catalogFilters, hasCustomFilters } = extractCatalogFilterParams(
    req.filterableFields ?? {}
  )

  if (catalogFilters.sort === "newest" && !hasCustomFilters) {
    req.queryConfig.pagination ??= { skip: 0 }
    req.queryConfig.pagination.order = { created_at: "DESC" }
  }

  if (FeatureFlag.isFeatureEnabled(IndexEngineFeatureFlag.key)) {
    // TODO: These filters are not supported by the index engine yet
    if (
      hasCustomFilters ||
      isPresent(req.filterableFields.tags) ||
      isPresent(req.filterableFields.categories) ||
      isPresent(req.filterableFields.option_value_id) ||
      isPresent(req.filterableFields.options)
    ) {
      return await getProducts(req, res, catalogFilters, hasCustomFilters)
    }

    return await getProductsWithIndexEngine(req, res)
  }

  return await getProducts(req, res, catalogFilters, hasCustomFilters)
}

async function getProductsWithIndexEngine(
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const context: QueryContextType = {}
  const { fields, withInventoryQuantity } = prepareInventoryQuantityFields(
    req.queryConfig.fields,
    { relation: "variants" }
  )
  req.queryConfig.fields = ensureMetadataInFields(fields)

  if (isPresent(req.pricingContext)) {
    context["variants"] ??= {}
    context["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext!
    )
  }

  const filters: Record<string, any> = req.filterableFields
  if (isPresent(filters.sales_channel_id)) {
    const salesChannelIds = filters.sales_channel_id

    filters["sales_channels"] ??= {}
    filters["sales_channels"]["id"] = salesChannelIds

    delete filters.sales_channel_id
  }

  // TODO: Remove once we implement search by relations in a similar way to query.graph
  if (isPresent(filters.q)) {
    filters["variants"] ??= {}
  }

  const { data: products = [], metadata } = await query.index(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters,
      pagination: req.queryConfig.pagination,
      context,
    },
    {
      cache: {
        enable: true,
      },
      locale: req.locale,
    }
  )

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      products.flatMap((product) => product.variants ?? [])
    )
  }

  await wrapProductsWithTaxPrices(req, products)
  enrichProductsWithStoreSummary(products)
  await enrichProductsWithBrand(req.scope, products)

  res.json({
    products,
    count: metadata!.estimate_count,
    estimate_count: metadata!.estimate_count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

async function populateInventoryQuantity(
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  products: any[],
  useTotalFallback = false
) {
  const variants = products.flatMap((product) => product.variants ?? [])
  if (!variants.length) {
    return
  }

  if (!useTotalFallback) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(req, variants)
    return
  }

  const pkChannels = req.publishable_key_context?.sales_channel_ids ?? []
  const filterChannels = req.filterableFields?.sales_channel_id
  const hasSingleFilterChannel =
    (typeof filterChannels === "string" && Boolean(filterChannels)) ||
    (Array.isArray(filterChannels) && filterChannels.length === 1)

  if (pkChannels.length === 1 || hasSingleFilterChannel) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(req, variants)
  } else {
    await wrapVariantsWithTotalInventoryQuantity(req, variants)
  }
}

async function getProducts(
  req: RequestWithContext<HttpTypes.StoreProductListParams>,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>,
  catalogFilters: CatalogFilterParams = {},
  hasCustomFilters = false
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const context: object = {}

  const requestedFields = hasCustomFilters
    ? buildCandidateFields(req.queryConfig.fields, catalogFilters)
    : req.queryConfig.fields

  const { fields, withInventoryQuantity } = prepareInventoryQuantityFields(
    requestedFields,
    { relation: "variants" }
  )
  req.queryConfig.fields = ensureMetadataInFields(fields)

  if (isPresent(req.pricingContext)) {
    context["variants"] ??= {}
    context["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext!
    )
  }

  if (!hasCustomFilters) {
    const { data: products = [], metadata } = await query.graph(
      {
        entity: "product",
        fields: req.queryConfig.fields,
        filters: req.filterableFields,
        pagination: req.queryConfig.pagination,
        context,
      },
      {
        cache: {
          enable: true,
        },
        locale: req.locale,
      }
    )

    if (withInventoryQuantity) {
      await populateInventoryQuantity(req, products, false)
    }

    await wrapProductsWithTaxPrices(req, products)
    enrichProductsWithStoreSummary(products)
    await applyActiveAutomaticPromotionsToProducts(req.scope, products)
    await enrichProductsWithBrand(req.scope, products)

    return res.json({
      products,
      count: metadata!.count,
      offset: metadata!.skip,
      limit: metadata!.take,
    })
  }

  // Fetch all candidates matching base DB filters so custom filters, sorting,
  // and pagination operate accurately across the entire catalog.
  const { data: candidateProducts = [] } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination?.order
        ? { order: req.queryConfig.pagination.order }
        : undefined,
      context,
    },
    {
      cache: {
        enable: true,
      },
      locale: req.locale,
    }
  )

  if (withInventoryQuantity) {
    await populateInventoryQuantity(req, candidateProducts, true)
  }

  const filteredProducts = await filterCatalogProducts(
    candidateProducts,
    catalogFilters,
    req.scope
  )
  const sortedProducts = await sortCatalogProducts(
    filteredProducts,
    catalogFilters.sort,
    req.scope
  )

  const skip = req.queryConfig.pagination?.skip ?? 0
  const take = req.queryConfig.pagination?.take ?? 50
  const pagedProducts = sortedProducts.slice(skip, skip + take)

  await wrapProductsWithTaxPrices(req, pagedProducts)
  enrichProductsWithStoreSummary(pagedProducts)
  await applyActiveAutomaticPromotionsToProducts(req.scope, pagedProducts)
  await enrichProductsWithBrand(req.scope, pagedProducts)

  return res.json({
    products: pagedProducts,
    count: sortedProducts.length,
    offset: skip,
    limit: take,
  })
}
