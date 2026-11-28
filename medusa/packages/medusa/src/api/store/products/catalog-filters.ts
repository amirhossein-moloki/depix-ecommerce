import { MedusaContainer } from "@medusajs/framework/types"
import { isPresent, Modules } from "@medusajs/framework/utils"

export type CatalogSortOption =
  | "newest"
  | "bestselling"
  | "price_asc"
  | "price_desc"
  | "popular"

export interface CatalogFilterParams {
  brand_id?: string | string[]
  brand_slug?: string | string[]
  min_price?: number
  max_price?: number
  in_stock?: boolean
  has_discount?: boolean
  sort?: CatalogSortOption
}

interface BrandMatchers {
  ids: Set<string>
  slugs: Set<string>
  names: Set<string>
}

const CATALOG_FILTER_KEYS = [
  "brand_id",
  "brand_slug",
  "min_price",
  "max_price",
  "in_stock",
  "has_discount",
  "sort",
] as const

const toStringArray = (value?: string | string[]): string[] => {
  if (!isPresent(value)) {
    return []
  }
  return (Array.isArray(value) ? value : [value])
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
}

/**
 * Extracts custom catalog filter/sort params from `req.filterableFields` and
 * removes them from `filters` so `query.graph` / `query.index` only receives
 * native product entity filters.
 */
export const extractCatalogFilterParams = (
  filters: Record<string, any>
): {
  catalogFilters: CatalogFilterParams
  hasCustomFilters: boolean
} => {
  const catalogFilters: CatalogFilterParams = {}

  for (const key of CATALOG_FILTER_KEYS) {
    if (filters[key] !== undefined) {
      ;(catalogFilters as Record<string, any>)[key] = filters[key]
      delete filters[key]
    }
  }

  const hasNonNewestSort =
    catalogFilters.sort !== undefined && catalogFilters.sort !== "newest"

  const hasCustomFilters =
    isPresent(catalogFilters.brand_id) ||
    isPresent(catalogFilters.brand_slug) ||
    catalogFilters.min_price !== undefined ||
    catalogFilters.max_price !== undefined ||
    catalogFilters.in_stock !== undefined ||
    catalogFilters.has_discount !== undefined ||
    hasNonNewestSort

  return { catalogFilters, hasCustomFilters }
}

/**
 * Ensures the product query fetches all fields needed to evaluate active
 * catalog filters and sorting across the full result set.
 */
export const buildCandidateFields = (
  fields: string[],
  catalogFilters: CatalogFilterParams
): string[] => {
  const fieldSet = new Set(fields)

  if (
    isPresent(catalogFilters.brand_id) ||
    isPresent(catalogFilters.brand_slug) ||
    catalogFilters.has_discount !== undefined
  ) {
    fieldSet.add("metadata")
  }

  if (catalogFilters.in_stock !== undefined) {
    fieldSet.add("variants.id")
    fieldSet.add("variants.manage_inventory")
    fieldSet.add("variants.allow_backorder")
    fieldSet.add("variants.inventory_quantity")
  }

  if (
    catalogFilters.min_price !== undefined ||
    catalogFilters.max_price !== undefined ||
    catalogFilters.has_discount !== undefined ||
    catalogFilters.sort === "price_asc" ||
    catalogFilters.sort === "price_desc"
  ) {
    fieldSet.add("variants.prices.*")
    if (
      !Array.from(fieldSet).some(
        (f) =>
          f === "variants.calculated_price" ||
          f.startsWith("variants.calculated_price.")
      )
    ) {
      fieldSet.add("variants.calculated_price.*")
    }
  }

  if (catalogFilters.sort !== undefined) {
    fieldSet.add("created_at")
  }

  return Array.from(fieldSet)
}

/**
 * Resolves brand records from `Modules.BRAND` (when available) so filtering by
 * `brand_id` or `brand_slug` matches products regardless of whether metadata
 * stores `brand_id`, `brand_slug`, or `brand`.
 */
export const resolveBrandMatchers = async (
  scope: MedusaContainer,
  brandId?: string | string[],
  brandSlug?: string | string[]
): Promise<BrandMatchers> => {
  const ids = new Set(toStringArray(brandId))
  const slugs = new Set(toStringArray(brandSlug).map((s) => s.toLowerCase()))
  const names = new Set<string>()

  if (ids.size === 0 && slugs.size === 0) {
    return { ids, slugs, names }
  }

  try {
    const brandService = scope.resolve<any>(Modules.BRAND)
    if (brandService?.listBrands) {
      const orFilters: Record<string, any>[] = []
      if (ids.size > 0) {
        orFilters.push({ id: Array.from(ids) })
      }
      if (slugs.size > 0) {
        orFilters.push({ slug: Array.from(slugs) })
      }

      const brands = await brandService.listBrands({ $or: orFilters })
      for (const brand of brands ?? []) {
        if (brand?.id) {
          ids.add(String(brand.id))
        }
        if (brand?.slug) {
          slugs.add(String(brand.slug).toLowerCase())
        }
        if (brand?.name) {
          names.add(String(brand.name).toLowerCase())
        }
      }
    }
  } catch {
    // Modules.BRAND may be unregistered in minimal test containers; fall back to raw ID/slug matching
  }

  return { ids, slugs, names }
}

export const matchesBrand = (
  product: any,
  matchers: BrandMatchers
): boolean => {
  const metadata = product?.metadata ?? {}
  const metaBrandId = metadata.brand_id ? String(metadata.brand_id) : null
  const metaBrandSlug = metadata.brand_slug
    ? String(metadata.brand_slug).toLowerCase()
    : null
  const metaBrandName = metadata.brand
    ? String(metadata.brand).toLowerCase()
    : null

  if (metaBrandId && matchers.ids.has(metaBrandId)) {
    return true
  }
  if (metaBrandSlug && matchers.slugs.has(metaBrandSlug)) {
    return true
  }
  if (metaBrandName && matchers.names.has(metaBrandName)) {
    return true
  }

  return false
}

export const getVariantPrice = (variant: any): number | null => {
  const calculated = variant?.calculated_price?.calculated_amount
  if (calculated !== undefined && calculated !== null && Number.isFinite(Number(calculated))) {
    return Number(calculated)
  }

  if (Array.isArray(variant?.prices) && variant.prices.length > 0) {
    const irrPrice = variant.prices.find(
      (p: any) =>
        typeof p?.currency_code === "string" &&
        p.currency_code.toLowerCase() === "irr"
    )
    const fallbackPrice = irrPrice ?? variant.prices[0]
    if (
      fallbackPrice?.amount !== undefined &&
      fallbackPrice?.amount !== null &&
      Number.isFinite(Number(fallbackPrice.amount))
    ) {
      return Number(fallbackPrice.amount)
    }
  }

  return null
}

export const getProductMinPrice = (product: any): number | null => {
  const prices = (product?.variants ?? [])
    .map(getVariantPrice)
    .filter((p: number | null): p is number => p !== null)

  if (!prices.length) {
    return null
  }

  return Math.min(...prices)
}

export const matchesPriceRange = (
  product: any,
  minPrice?: number,
  maxPrice?: number
): boolean => {
  const variants = product?.variants ?? []
  return variants.some((variant: any) => {
    const price = getVariantPrice(variant)
    if (price === null) {
      return false
    }
    if (minPrice !== undefined && price < minPrice) {
      return false
    }
    if (maxPrice !== undefined && price > maxPrice) {
      return false
    }
    return true
  })
}

export const isProductInStock = (product: any): boolean => {
  const variants = product?.variants ?? []
  return variants.some(
    (variant: any) =>
      variant?.manage_inventory === false ||
      variant?.allow_backorder === true ||
      Number(variant?.inventory_quantity ?? 0) > 0
  )
}

export const hasProductDiscount = (product: any): boolean => {
  if (Number(product?.discount ?? 0) > 0) {
    return true
  }

  if (
    product?.realPrice !== undefined &&
    product?.realPrice !== null &&
    product?.finalPrice !== undefined &&
    product?.finalPrice !== null &&
    Number(product.realPrice) > Number(product.finalPrice)
  ) {
    return true
  }

  const metadata = product?.metadata ?? {}
  if (
    metadata.has_discount === true ||
    Number(metadata.discount_percentage ?? 0) > 0
  ) {
    return true
  }

  const variants = product?.variants ?? []
  return variants.some((variant: any) => {
    const compareAt = Number(variant?.metadata?.compare_at_price ?? 0)
    const variantPrice = getVariantPrice(variant)
    if (
      Number.isFinite(compareAt) &&
      compareAt > 0 &&
      compareAt > (variantPrice ?? Infinity)
    ) {
      return true
    }

    const calc = variant?.calculated_price
    if (!calc) {
      return false
    }
    if (
      calc.original_amount !== undefined &&
      calc.original_amount !== null &&
      calc.calculated_amount !== undefined &&
      calc.calculated_amount !== null
    ) {
      return Number(calc.calculated_amount) < Number(calc.original_amount)
    }
    return false
  })
}

const compareCreatedAtDesc = (a: any, b: any): number => {
  const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0
  const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0
  return timeB - timeA
}

const computeOrderStats = async (
  scope: MedusaContainer
): Promise<{
  salesVolume: Record<string, number>
  orderFrequency: Record<string, number>
}> => {
  const salesVolume: Record<string, number> = {}
  const orderFrequency: Record<string, number> = {}

  try {
    const orderService = scope.resolve<any>(Modules.ORDER)
    if (!orderService?.listAndCountOrders) {
      return { salesVolume, orderFrequency }
    }

    const [orders] = await orderService.listAndCountOrders(
      { status: { $ne: "canceled" } },
      { relations: ["items"], take: 1000 }
    )

    for (const order of orders ?? []) {
      const seenInOrder = new Set<string>()
      for (const item of order?.items ?? []) {
        const pid = item?.product_id
        if (!pid) {
          continue
        }
        const qty = Number(item.quantity) || 0
        salesVolume[pid] = (salesVolume[pid] || 0) + qty
        if (!seenInOrder.has(pid)) {
          orderFrequency[pid] = (orderFrequency[pid] || 0) + 1
          seenInOrder.add(pid)
        }
      }
    }
  } catch {
    // Order module unavailable
  }

  return { salesVolume, orderFrequency }
}

const computeReviewStats = async (
  scope: MedusaContainer
): Promise<Record<string, { avgRating: number; count: number }>> => {
  const reviewsByProduct: Record<string, { avgRating: number; count: number }> =
    {}

  try {
    const reviewService = scope.resolve<any>(Modules.REVIEW)
    if (!reviewService?.listAndCountProductReviews) {
      return reviewsByProduct
    }

    const [reviews] = await reviewService.listAndCountProductReviews(
      {},
      { take: 1000 }
    )

    for (const rev of reviews ?? []) {
      const pid = rev?.product_id
      if (!pid) {
        continue
      }
      if (!reviewsByProduct[pid]) {
        reviewsByProduct[pid] = { avgRating: 0, count: 0 }
      }
      reviewsByProduct[pid].count++
      reviewsByProduct[pid].avgRating += Number(rev.rating) || 0
    }

    for (const pid of Object.keys(reviewsByProduct)) {
      if (reviewsByProduct[pid].count > 0) {
        reviewsByProduct[pid].avgRating /= reviewsByProduct[pid].count
      }
    }
  } catch {
    // Review module unavailable
  }

  return reviewsByProduct
}

/**
 * Applies `brand_id`/`brand_slug`, `min_price`/`max_price`, `in_stock`, and
 * `has_discount` filters across the full candidate product list.
 */
export const filterCatalogProducts = async (
  products: any[],
  catalogFilters: CatalogFilterParams,
  scope: MedusaContainer
): Promise<any[]> => {
  let result = products

  if (
    isPresent(catalogFilters.brand_id) ||
    isPresent(catalogFilters.brand_slug)
  ) {
    const matchers = await resolveBrandMatchers(
      scope,
      catalogFilters.brand_id,
      catalogFilters.brand_slug
    )
    result = result.filter((product) => matchesBrand(product, matchers))
  }

  if (
    catalogFilters.min_price !== undefined ||
    catalogFilters.max_price !== undefined
  ) {
    result = result.filter((product) =>
      matchesPriceRange(
        product,
        catalogFilters.min_price,
        catalogFilters.max_price
      )
    )
  }

  if (catalogFilters.in_stock !== undefined) {
    result = result.filter((product) =>
      catalogFilters.in_stock
        ? isProductInStock(product)
        : !isProductInStock(product)
    )
  }

  if (catalogFilters.has_discount !== undefined) {
    result = result.filter((product) =>
      catalogFilters.has_discount
        ? hasProductDiscount(product)
        : !hasProductDiscount(product)
    )
  }

  return result
}

/**
 * Sorts candidate products according to `sort` before pagination slicing.
 */
export const sortCatalogProducts = async (
  products: any[],
  sort: CatalogSortOption | undefined,
  scope: MedusaContainer
): Promise<any[]> => {
  if (!sort) {
    return products
  }

  const copy = [...products]

  if (sort === "newest") {
    return copy.sort(compareCreatedAtDesc)
  }

  if (sort === "price_asc" || sort === "price_desc") {
    const direction = sort === "price_asc" ? 1 : -1
    return copy.sort((a, b) => {
      const priceA = getProductMinPrice(a)
      const priceB = getProductMinPrice(b)

      if (priceA === null && priceB === null) {
        return compareCreatedAtDesc(a, b)
      }
      if (priceA === null) {
        return 1
      }
      if (priceB === null) {
        return -1
      }
      if (priceA !== priceB) {
        return (priceA - priceB) * direction
      }
      return compareCreatedAtDesc(a, b)
    })
  }

  if (sort === "bestselling") {
    const { salesVolume } = await computeOrderStats(scope)
    return copy.sort((a, b) => {
      const diff = (salesVolume[b.id] || 0) - (salesVolume[a.id] || 0)
      return diff !== 0 ? diff : compareCreatedAtDesc(a, b)
    })
  }

  if (sort === "popular") {
    const [{ salesVolume, orderFrequency }, reviewsByProduct] =
      await Promise.all([computeOrderStats(scope), computeReviewStats(scope)])

    const scoreFor = (pid: string): number => {
      const totalOrders = orderFrequency[pid] || 0
      const totalQty = salesVolume[pid] || 0
      const rev = reviewsByProduct[pid] || { avgRating: 0, count: 0 }
      return Math.round(
        totalOrders * 5 + totalQty * 2 + rev.avgRating * rev.count
      )
    }

    return copy.sort((a, b) => {
      const diff = scoreFor(b.id) - scoreFor(a.id)
      return diff !== 0 ? diff : compareCreatedAtDesc(a, b)
    })
  }

  return copy
}
