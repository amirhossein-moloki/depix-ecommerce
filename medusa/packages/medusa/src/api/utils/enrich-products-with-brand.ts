import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export interface ProductBrandSummary {
  id: string
  name: string
  slug: string
  logo_id: string | null
  metadata: Record<string, unknown> | null
}

function toBrandSummary(brand: any): ProductBrandSummary {
  return {
    id: String(brand.id),
    name: String(brand.name),
    slug: String(brand.slug),
    logo_id: brand.logo_id ?? null,
    metadata: (brand.metadata as Record<string, unknown>) ?? null,
  }
}

/**
 * Ensures `"metadata"` is included in a query field selection array so brand
 * references stored in `product.metadata` can always be resolved.
 */
export function ensureMetadataInFields(fields: string[] = []): string[] {
  if (fields.includes("metadata") || fields.includes("*")) {
    return fields
  }
  return [...fields, "metadata"]
}

/**
 * Resolves and attaches `product.brand` in a single batched query against
 * `Modules.BRAND` using `metadata.brand_id`, `metadata.brand_slug`, or `metadata.brand`.
 */
export async function enrichProductsWithBrand(
  scope: MedusaContainer,
  products: any[]
): Promise<void> {
  if (!Array.isArray(products) || products.length === 0) {
    return
  }

  const brandIds = new Set<string>()
  const brandSlugs = new Set<string>()
  const brandNames = new Set<string>()

  for (const product of products) {
    if (!product || typeof product !== "object") {
      continue
    }
    const meta = product.metadata ?? {}
    if (typeof meta.brand_id === "string" && meta.brand_id.trim()) {
      brandIds.add(meta.brand_id.trim())
    }
    if (typeof meta.brand_slug === "string" && meta.brand_slug.trim()) {
      brandSlugs.add(meta.brand_slug.trim().toLowerCase())
    }
    if (typeof meta.brand === "string" && meta.brand.trim()) {
      brandNames.add(meta.brand.trim())
    }
  }

  if (brandIds.size === 0 && brandSlugs.size === 0 && brandNames.size === 0) {
    for (const product of products) {
      if (product && typeof product === "object") {
        product.brand = product.brand ?? null
      }
    }
    return
  }

  let brands: any[] = []
  try {
    const brandService = scope.resolve<any>(Modules.BRAND)
    if (brandService?.listBrands) {
      const orFilters: Record<string, any>[] = []
      if (brandIds.size > 0) {
        orFilters.push({ id: Array.from(brandIds) })
      }
      if (brandSlugs.size > 0) {
        orFilters.push({ slug: Array.from(brandSlugs) })
      }
      if (brandNames.size > 0) {
        orFilters.push({ name: Array.from(brandNames) })
      }

      if (orFilters.length > 0) {
        const listed = await brandService.listBrands({ $or: orFilters })
        if (Array.isArray(listed)) {
          brands = listed
        }
      }
    }
  } catch {
    // Modules.BRAND may be unregistered in minimal test scopes
  }

  const byId = new Map<string, ProductBrandSummary>()
  const bySlug = new Map<string, ProductBrandSummary>()
  const byName = new Map<string, ProductBrandSummary>()

  for (const rawBrand of brands) {
    if (!rawBrand?.id) {
      continue
    }
    const summary = toBrandSummary(rawBrand)
    byId.set(summary.id, summary)
    if (summary.slug) {
      bySlug.set(summary.slug.toLowerCase(), summary)
    }
    if (summary.name) {
      byName.set(summary.name.toLowerCase(), summary)
    }
  }

  for (const product of products) {
    if (!product || typeof product !== "object") {
      continue
    }
    const meta = product.metadata ?? {}
    const metaId =
      typeof meta.brand_id === "string" ? meta.brand_id.trim() : ""
    const metaSlug =
      typeof meta.brand_slug === "string"
        ? meta.brand_slug.trim().toLowerCase()
        : ""
    const metaName =
      typeof meta.brand === "string" ? meta.brand.trim().toLowerCase() : ""

    const matched =
      (metaId ? byId.get(metaId) : undefined) ||
      (metaSlug ? bySlug.get(metaSlug) : undefined) ||
      (metaName ? byName.get(metaName) : undefined) ||
      null

    product.brand = matched
  }
}
