export interface ProductJsonLdOptions {
  /**
   * Base canonical site URL (e.g., "https://example.com")
   */
  baseUrl?: string
  /**
   * Currency code (e.g. "IRR", "USD")
   */
  currency?: string
  /**
   * Approved public reviews for the product
   */
  reviews?: Array<{
    id: string
    title?: string | null
    content?: string | null
    rating: number
    created_at?: string | Date
    customer?: {
      first_name?: string | null
      last_name?: string | null
    } | null
    customer_name?: string | null
  }>
  /**
   * Rating summary for the product
   */
  ratingSummary?: {
    average_rating: number
    review_count: number
  } | null
}

/**
 * Normalizes URL into an absolute URL using the provided baseUrl.
 */
function toAbsoluteUrl(url: string | null | undefined, baseUrl: string): string | undefined {
  if (!url) {
    return undefined
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  const cleanBase = baseUrl.replace(/\/+$/, "")
  const cleanPath = url.replace(/^\/+/, "")
  return `${cleanBase}/${cleanPath}`
}

/**
 * Extracts a numeric price value from variant object.
 */
function extractVariantPrice(variant: any): number {
  if (variant.calculated_price !== undefined && variant.calculated_price !== null) {
    if (typeof variant.calculated_price === "object") {
      if (typeof variant.calculated_price.calculated_amount === "number") {
        return variant.calculated_price.calculated_amount
      }
      if (typeof variant.calculated_price.amount === "number") {
        return variant.calculated_price.amount
      }
    } else if (typeof variant.calculated_price === "number") {
      return variant.calculated_price
    }
  }

  if (Array.isArray(variant.prices) && variant.prices.length > 0) {
    const p = variant.prices[0]
    if (typeof p.amount === "number") {
      return p.amount
    }
  }

  if (typeof variant.original_price === "number") {
    return variant.original_price
  }

  return 0
}

/**
 * Determines Schema.org availability URL based on variant inventory settings.
 */
function determineAvailability(variant: any): string {
  if (variant.manage_inventory === false) {
    return "https://schema.org/InStock"
  }

  if (typeof variant.inventory_quantity === "number") {
    if (variant.inventory_quantity > 0 || variant.allow_backorder === true) {
      return "https://schema.org/InStock"
    }
    return "https://schema.org/OutOfStock"
  }

  if (variant.allow_backorder === true) {
    return "https://schema.org/InStock"
  }

  return "https://schema.org/InStock"
}

/**
 * Generates Schema.org Product JSON-LD structured data for a given Medusa product.
 */
export function generateProductJsonLd(
  product: any,
  options: ProductJsonLdOptions = {}
): Record<string, any> {
  if (!product || typeof product !== "object") {
    throw new Error("Invalid product provided for JSON-LD generation")
  }

  const baseUrl = (options.baseUrl || process.env.STORE_URL || process.env.PUBLIC_URL || "http://localhost:3000").replace(/\/+$/, "")
  const productUrl = `${baseUrl}/products/${product.handle || product.id}`

  // 1. Identity
  const name = product.title || "Untitled Product"
  const description = product.description || product.subtitle || undefined
  const primaryVariant = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants[0] : null
  const sku = primaryVariant?.sku || product.id

  // GTIN / EAN / UPC
  const gtin = primaryVariant?.gtin || primaryVariant?.ean || primaryVariant?.upc || primaryVariant?.barcode || product.metadata?.gtin || primaryVariant?.metadata?.gtin || undefined
  const mpn = primaryVariant?.metadata?.mpn || product.metadata?.mpn || primaryVariant?.mid_code || product.mid_code || undefined

  // Brand
  let brandObj: any = undefined
  const brandVal = product.metadata?.brand || product.brand
  if (typeof brandVal === "string" && brandVal.trim().length > 0) {
    brandObj = {
      "@type": "Brand",
      name: brandVal.trim(),
    }
  } else if (brandVal && typeof brandVal === "object" && typeof brandVal.name === "string") {
    brandObj = {
      "@type": "Brand",
      name: brandVal.name.trim(),
    }
  }

  // Category
  let categoryName: string | undefined = undefined
  if (Array.isArray(product.categories) && product.categories.length > 0) {
    const publicCat = product.categories.find((c: any) => !c.is_internal)
    if (publicCat?.name) {
      categoryName = publicCat.name
    }
  }

  // Images
  const rawImages: string[] = []
  if (product.thumbnail) {
    rawImages.push(product.thumbnail)
  }
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (img?.url) {
        rawImages.push(img.url)
      }
    }
  }

  const imageArray = Array.from(
    new Set(
      rawImages
        .map((img) => toAbsoluteUrl(img, baseUrl))
        .filter((url): url is string => Boolean(url))
    )
  )

  // Offers
  const defaultCurrency = (options.currency || primaryVariant?.calculated_price?.currency_code || primaryVariant?.prices?.[0]?.currency_code || "IRR").toUpperCase()

  const offers: any[] = []
  const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : [product]

  for (const v of variants) {
    const price = extractVariantPrice(v)
    const offerCurrency = (v.calculated_price?.currency_code || v.prices?.[0]?.currency_code || defaultCurrency).toUpperCase()
    const offerSku = v.sku || v.id || sku
    const offerUrl = v.id ? `${productUrl}?variant=${v.id}` : productUrl
    const availability = determineAvailability(v)

    offers.push({
      "@type": "Offer",
      sku: offerSku,
      price: price,
      priceCurrency: offerCurrency,
      availability: availability,
      url: offerUrl,
      itemCondition: "https://schema.org/NewCondition",
    })
  }

  // Aggregate Rating
  let aggregateRating: any = undefined
  if (
    options.ratingSummary &&
    typeof options.ratingSummary.review_count === "number" &&
    options.ratingSummary.review_count > 0 &&
    typeof options.ratingSummary.average_rating === "number" &&
    options.ratingSummary.average_rating > 0
  ) {
    aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: options.ratingSummary.average_rating,
      reviewCount: options.ratingSummary.review_count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Reviews
  let reviewsList: any[] | undefined = undefined
  if (Array.isArray(options.reviews) && options.reviews.length > 0) {
    const formatted = options.reviews.map((r) => {
      let authorName = "Customer"
      if (r.customer_name) {
        authorName = r.customer_name
      } else if (r.customer) {
        const parts = [r.customer.first_name, r.customer.last_name].filter(Boolean)
        if (parts.length > 0) {
          authorName = parts.join(" ")
        }
      }

      const rev: any = {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        author: {
          "@type": "Person",
          name: authorName,
        },
      }

      if (r.created_at) {
        rev.datePublished = new Date(r.created_at).toISOString()
      }
      if (r.title) {
        rev.name = r.title
      }
      if (r.content) {
        rev.reviewBody = r.content
      }

      return rev
    })

    if (formatted.length > 0) {
      reviewsList = formatted
    }
  }

  // Build schema object
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: name,
    url: productUrl,
    sku: sku,
  }

  if (description) {
    schema.description = description
  }
  if (imageArray.length > 0) {
    schema.image = imageArray.length === 1 ? imageArray[0] : imageArray
  }
  if (gtin) {
    schema.gtin = gtin
  }
  if (mpn) {
    schema.mpn = mpn
  }
  if (brandObj) {
    schema.brand = brandObj
  }
  if (categoryName) {
    schema.category = categoryName
  }

  if (offers.length > 0) {
    schema.offers = offers.length === 1 ? offers[0] : offers
  }

  if (aggregateRating) {
    schema.aggregateRating = aggregateRating
  }
  if (reviewsList) {
    schema.review = reviewsList
  }

  return schema
}

/**
 * Safely stringifies a JSON-LD object preventing script injection (XSS) when embedded in HTML script tags.
 */
export function serializeJsonLd(jsonLdObject: Record<string, any>): string {
  const jsonString = JSON.stringify(jsonLdObject, null, 2)
  return jsonString
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}
