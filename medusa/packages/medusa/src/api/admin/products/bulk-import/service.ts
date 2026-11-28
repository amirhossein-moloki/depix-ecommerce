import {
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createProductVariantsWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/core-flows"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
  toHandle,
} from "@medusajs/framework/utils"
import { adjustVariantInventory } from "../../inventory/utils/adjust-variant-inventory"
import { ensureProductDefaultInventoryAndChannel } from "../utils/ensure-default-inventory"
import {
  AdminBulkImportProductsType,
  BulkImportBrandInputType,
  BulkImportCategoryInputType,
  BulkImportProductInputType,
  BulkImportVariantInputType,
} from "./validators"

export type BulkImportItemStatus =
  | "created"
  | "updated"
  | "skipped"
  | "would_create"
  | "would_update"
  | "would_skip"
  | "failed"

export interface BulkImportItemResult {
  index: number
  handle: string
  title: string
  status: BulkImportItemStatus
  product_id: string | null
  category_ids: string[]
  brand_id: string | null
  variants_created: number
  variants_updated: number
  warnings: string[]
  errors: string[]
}

export interface BulkImportResponse {
  dry_run: boolean
  mode: "upsert" | "skip" | "create_only"
  price_unit: "irr" | "irt"
  download_images: boolean
  summary: {
    total: number
    created: number
    updated: number
    skipped: number
    failed: number
    categories_created: number
    brands_created: number
  }
  warnings: string[]
  results: BulkImportItemResult[]
}

interface ResolvedCategory {
  id: string
  slug: string
  created: boolean
}

interface ResolvedBrand {
  id: string
  name: string
  slug: string
  created: boolean
}

interface NormalizedVariant {
  title: string
  sku?: string
  barcode?: string | null
  ean?: string | null
  upc?: string | null
  priceIrr: number
  compareAtIrr: number | null
  hasExplicitCompareAt: boolean
  hasExplicitStock: boolean
  stock: number
  manageInventory: boolean
  allowBackorder: boolean
  options: Record<string, string>
  metadata: Record<string, unknown>
}

interface NormalizedProduct {
  handle: string
  title: string
  subtitle?: string | null
  description?: string | null
  status: ProductStatus
  options: Array<{ title: string; values: string[] }>
  variants: NormalizedVariant[]
  isSimpleSingleVariant: boolean
}

export function normalizePriceToIrr(
  rawAmount: number,
  priceUnit: "irr" | "irt"
): number {
  if (!Number.isFinite(rawAmount) || rawAmount < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid price value: ${rawAmount}`
    )
  }
  const multiplier = priceUnit === "irt" ? 10 : 1
  return Math.round(rawAmount * multiplier)
}

function isValidImageUrl(url: string): boolean {
  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/")
  )
}

/**
 * Normalizes product thumbnail and gallery image URLs.
 * Keeps an extension seam for future SSRF-safe media downloads when `download_images` is true.
 */
export function resolveProductImages(
  productInput: BulkImportProductInputType
): {
  thumbnail?: string | null
  images?: Array<{ url: string }>
} {
  const rawImages = productInput.images ?? []
  const normalizedImages: Array<{ url: string }> = []

  for (const item of rawImages) {
    const url = (typeof item === "string" ? item : item.url).trim()
    if (!isValidImageUrl(url)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid image URL '${url}'. Expected http(s):// URL or relative '/' path.`
      )
    }
    normalizedImages.push({ url })
  }

  let thumbnail = productInput.thumbnail ?? undefined
  if (typeof thumbnail === "string") {
    thumbnail = thumbnail.trim()
    if (!isValidImageUrl(thumbnail)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid thumbnail URL '${thumbnail}'.`
      )
    }
  } else if (thumbnail === undefined && normalizedImages.length > 0) {
    thumbnail = normalizedImages[0].url
  }

  return {
    ...(thumbnail !== undefined ? { thumbnail } : {}),
    ...(productInput.images !== undefined ? { images: normalizedImages } : {}),
  }
}

function normalizeVariant(
  variant: Partial<BulkImportVariantInputType>,
  fallbackTitle: string,
  options: Record<string, string>,
  priceUnit: "irr" | "irt"
): NormalizedVariant {
  const rawPrice = variant.price_irr ?? variant.price
  if (rawPrice === undefined || rawPrice === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Variant '${variant.title || fallbackTitle}' is missing price_irr or price.`
    )
  }

  const priceIrr = normalizePriceToIrr(rawPrice, priceUnit)

  const hasExplicitCompareAt =
    variant.compare_at_price_irr !== undefined ||
    variant.compare_at_price !== undefined
  const rawCompareAt =
    variant.compare_at_price_irr ?? variant.compare_at_price ?? null
  const compareAtIrr =
    rawCompareAt !== null && rawCompareAt !== undefined
      ? normalizePriceToIrr(rawCompareAt, priceUnit)
      : null

  const hasExplicitStock = variant.stock !== undefined
  const stock = hasExplicitStock ? Math.floor(Number(variant.stock)) : 0
  if (!Number.isInteger(stock) || stock < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Variant '${variant.title || fallbackTitle}' stock must be a non-negative integer.`
    )
  }

  const baseMeta =
    variant.metadata && typeof variant.metadata === "object"
      ? { ...variant.metadata }
      : {}

  const metadata: Record<string, unknown> = {
    ...baseMeta,
    initial_stock: stock,
  }
  if (compareAtIrr !== null && compareAtIrr > 0) {
    metadata.compare_at_price = compareAtIrr
  }

  return {
    title: (variant.title || fallbackTitle).trim(),
    ...(variant.sku ? { sku: variant.sku.trim() } : {}),
    ...(variant.barcode !== undefined ? { barcode: variant.barcode } : {}),
    ...(variant.ean !== undefined ? { ean: variant.ean } : {}),
    ...(variant.upc !== undefined ? { upc: variant.upc } : {}),
    priceIrr,
    compareAtIrr,
    hasExplicitCompareAt,
    hasExplicitStock,
    stock,
    manageInventory: variant.manage_inventory ?? true,
    allowBackorder: variant.allow_backorder ?? false,
    options,
    metadata,
  }
}

function normalizeProductStructure(
  productInput: BulkImportProductInputType,
  priceUnit: "irr" | "irt"
): NormalizedProduct {
  const handle = (productInput.handle || toHandle(productInput.title))
    .trim()
    .toLowerCase()

  if (!handle) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Could not derive a valid handle for product '${productInput.title}'.`
    )
  }

  const rawVariants = productInput.variants ?? []

  // Simple product with no variants array -> synthesize default option + variant (compatible with ProductForm.tsx)
  if (rawVariants.length === 0) {
    const defaultOptionTitle = productInput.options?.[0]?.title || "نوع"
    const defaultOptionValue =
      productInput.options?.[0]?.values?.[0] || "استاندارد"

    const synthesizedVariant = normalizeVariant(
      {
        title: productInput.title,
        sku: productInput.sku,
        barcode: productInput.barcode,
        ean: productInput.ean,
        upc: productInput.upc,
        price_irr: productInput.price_irr,
        price: productInput.price,
        compare_at_price_irr: productInput.compare_at_price_irr,
        compare_at_price: productInput.compare_at_price,
        stock: productInput.stock,
        manage_inventory: productInput.manage_inventory,
        allow_backorder: productInput.allow_backorder,
      },
      productInput.title,
      { [defaultOptionTitle]: defaultOptionValue },
      priceUnit
    )

    return {
      handle,
      title: productInput.title.trim(),
      subtitle: productInput.subtitle,
      description: productInput.description,
      status: productInput.status ?? ProductStatus.PUBLISHED,
      options: [{ title: defaultOptionTitle, values: [defaultOptionValue] }],
      variants: [synthesizedVariant],
      isSimpleSingleVariant: true,
    }
  }

  // Simple product represented with 1 variant without explicit options
  if (
    rawVariants.length === 1 &&
    (!rawVariants[0].options || Object.keys(rawVariants[0].options).length === 0) &&
    (!productInput.options || productInput.options.length === 0)
  ) {
    const synthesizedVariant = normalizeVariant(
      rawVariants[0],
      productInput.title,
      { نوع: "استاندارد" },
      priceUnit
    )
    return {
      handle,
      title: productInput.title.trim(),
      subtitle: productInput.subtitle,
      description: productInput.description,
      status: productInput.status ?? ProductStatus.PUBLISHED,
      options: [{ title: "نوع", values: ["استاندارد"] }],
      variants: [synthesizedVariant],
      isSimpleSingleVariant: true,
    }
  }

  // Derive options from variants if caller omitted explicit `options`
  let resolvedOptions: Array<{ title: string; values: string[] }> = []
  if (productInput.options && productInput.options.length > 0) {
    resolvedOptions = productInput.options.map((opt) => ({
      title: opt.title.trim(),
      values: Array.from(new Set(opt.values.map((v) => v.trim()))),
    }))
  } else {
    const derivedMap = new Map<string, Set<string>>()
    for (const variant of rawVariants) {
      for (const [k, val] of Object.entries(variant.options ?? {})) {
        const key = k.trim()
        if (!derivedMap.has(key)) {
          derivedMap.set(key, new Set())
        }
        derivedMap.get(key)!.add(val.trim())
      }
    }
    if (derivedMap.size === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Product '${productInput.title}' has multiple variants without option definitions.`
      )
    }
    resolvedOptions = Array.from(derivedMap.entries()).map(([title, set]) => ({
      title,
      values: Array.from(set),
    }))
  }

  const optionValueSets = new Map<string, Set<string>>(
    resolvedOptions.map((o) => [o.title, new Set(o.values)])
  )

  const seenVariantSkus = new Set<string>()
  const seenOptionSignatures = new Set<string>()
  const normalizedVariants: NormalizedVariant[] = []

  for (let idx = 0; idx < rawVariants.length; idx++) {
    const rawVar = rawVariants[idx]
    const varOptions = rawVar.options ?? {}

    for (const opt of resolvedOptions) {
      const val = varOptions[opt.title]
      if (!val || !optionValueSets.get(opt.title)?.has(val.trim())) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variant #${idx + 1} of '${productInput.title}' has missing or invalid value for option '${opt.title}'.`
        )
      }
    }

    const cleanOptions: Record<string, string> = {}
    for (const opt of resolvedOptions) {
      cleanOptions[opt.title] = varOptions[opt.title].trim()
    }

    const signature = buildOptionSignature(cleanOptions)
    if (seenOptionSignatures.has(signature)) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Product '${productInput.title}' contains duplicate variant option combination (${signature}).`
      )
    }
    seenOptionSignatures.add(signature)

    const fallbackTitle = `${productInput.title} - ${Object.values(cleanOptions).join(" / ")}`
    const normalizedVar = normalizeVariant(
      rawVar,
      fallbackTitle,
      cleanOptions,
      priceUnit
    )

    if (normalizedVar.sku) {
      if (seenVariantSkus.has(normalizedVar.sku)) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `Product '${productInput.title}' has duplicate SKU '${normalizedVar.sku}'.`
        )
      }
      seenVariantSkus.add(normalizedVar.sku)
    }

    normalizedVariants.push(normalizedVar)
  }

  return {
    handle,
    title: productInput.title.trim(),
    subtitle: productInput.subtitle,
    description: productInput.description,
    status: productInput.status ?? ProductStatus.PUBLISHED,
    options: resolvedOptions,
    variants: normalizedVariants,
    isSimpleSingleVariant: false,
  }
}

function buildOptionSignature(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join("|")
}

function extractExistingVariantOptions(
  existingVariant: any,
  optionTitleById: Map<string, string>
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const optVal of existingVariant?.options ?? []) {
    const title =
      optVal?.option?.title || optionTitleById.get(optVal?.option_id)
    if (title && optVal?.value !== undefined) {
      result[String(title)] = String(optVal.value)
    }
  }
  return result
}

function matchExistingVariant(
  incoming: NormalizedVariant,
  existingVariants: any[],
  optionTitleById: Map<string, string>,
  isSimpleSingleVariant: boolean
): any | undefined {
  if (incoming.sku) {
    const bySku = existingVariants.find(
      (v) => v?.sku && String(v.sku) === incoming.sku
    )
    if (bySku) {
      return bySku
    }
  }

  const incomingSig = buildOptionSignature(incoming.options)
  const byOptions = existingVariants.find((v) => {
    const existingOpts = extractExistingVariantOptions(v, optionTitleById)
    return buildOptionSignature(existingOpts) === incomingSig
  })
  if (byOptions) {
    return byOptions
  }

  if (isSimpleSingleVariant && existingVariants.length === 1) {
    return existingVariants[0]
  }

  return undefined
}

function collectTags(tagsInput?: BulkImportProductInputType["tags"]): {
  tagLabels: string[]
  tagIds: Array<{ id: string }>
} {
  const tagLabels: string[] = []
  const tagIds: Array<{ id: string }> = []

  for (const item of tagsInput ?? []) {
    if (typeof item === "string") {
      const trimmed = item.trim()
      if (trimmed) tagLabels.push(trimmed)
    } else if (item && typeof item === "object") {
      if (item.value?.trim()) tagLabels.push(item.value.trim())
      if (item.id?.trim()) tagIds.push({ id: item.id.trim() })
    }
  }

  return {
    tagLabels: Array.from(new Set(tagLabels)),
    tagIds,
  }
}

export async function bulkImportProducts(
  scope: MedusaContainer,
  input: AdminBulkImportProductsType,
  actorId = "admin"
): Promise<BulkImportResponse> {
  const { mode, dry_run: dryRun, price_unit: priceUnit, download_images: downloadImages } =
    input

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const productService = scope.resolve<any>(Modules.PRODUCT)

  let brandService: any = null
  try {
    brandService = scope.resolve<any>(Modules.BRAND)
  } catch {
    brandService = null
  }

  const warnings: string[] = []
  if (downloadImages) {
    warnings.push(
      "download_images=true is reserved for future SSRF-safe media fetching; direct image URLs were stored in v1."
    )
  }

  // Pre-index category definitions from the batch so parent_slug lookups find rich definitions regardless of item order
  const categoryDefinitionsBySlug = new Map<string, BulkImportCategoryInputType>()
  for (const p of input.products) {
    const cats = [
      ...(p.category ? [p.category] : []),
      ...(p.categories ?? []),
    ]
    for (const c of cats) {
      if (c.slug || c.name) {
        const slug = (c.slug || toHandle(c.name!)).trim().toLowerCase()
        if (slug && !categoryDefinitionsBySlug.has(slug)) {
          categoryDefinitionsBySlug.set(slug, c)
        }
      }
    }
  }

  const categoryCacheById = new Map<string, ResolvedCategory>()
  const categoryCacheBySlug = new Map<string, ResolvedCategory>()
  const brandCacheById = new Map<string, ResolvedBrand>()
  const brandCacheBySlug = new Map<string, ResolvedBrand>()

  let categoriesCreated = 0
  let brandsCreated = 0

  async function findOrCreateCategory(
    catInput: BulkImportCategoryInputType,
    ancestry: Set<string> = new Set()
  ): Promise<ResolvedCategory> {
    if (catInput.id) {
      const cached = categoryCacheById.get(catInput.id)
      if (cached) return cached

      const existing = await productService
        .retrieveProductCategory(catInput.id)
        .catch(() => null)
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Category with ID '${catInput.id}' does not exist.`
        )
      }
      const resolved: ResolvedCategory = {
        id: existing.id,
        slug: existing.handle || catInput.slug || existing.id,
        created: false,
      }
      categoryCacheById.set(resolved.id, resolved)
      if (resolved.slug) {
        categoryCacheBySlug.set(resolved.slug.toLowerCase(), resolved)
      }
      return resolved
    }

    const slug = (catInput.slug || toHandle(catInput.name!))
      .trim()
      .toLowerCase()
    if (!slug) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Category slug or name is required."
      )
    }

    if (ancestry.has(slug)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Circular parent_slug category hierarchy detected involving '${slug}'.`
      )
    }

    const cached = categoryCacheBySlug.get(slug)
    if (cached) return cached

    let parentCategoryId: string | null = null
    if (catInput.parent_slug) {
      const parentSlug = catInput.parent_slug.trim().toLowerCase()
      const parentDef = categoryDefinitionsBySlug.get(parentSlug) ?? {
        slug: parentSlug,
        name: catInput.parent_name || parentSlug,
      }
      const nextAncestry = new Set(ancestry)
      nextAncestry.add(slug)
      const resolvedParent = await findOrCreateCategory(parentDef, nextAncestry)
      parentCategoryId = resolvedParent.id
    }

    const existingList = await productService.listProductCategories({
      handle: slug,
    })
    const existing = Array.isArray(existingList) ? existingList[0] : null
    if (existing) {
      const resolved: ResolvedCategory = {
        id: existing.id,
        slug: existing.handle || slug,
        created: false,
      }
      categoryCacheBySlug.set(slug, resolved)
      categoryCacheById.set(resolved.id, resolved)
      return resolved
    }

    if (dryRun) {
      categoriesCreated++
      const simulated: ResolvedCategory = {
        id: `dry_pcat_${slug}`,
        slug,
        created: true,
      }
      categoryCacheBySlug.set(slug, simulated)
      return simulated
    }

    const created = await productService.createProductCategories({
      name: (catInput.name || slug).trim(),
      handle: slug,
      description: catInput.description || "",
      is_active: catInput.is_active ?? true,
      rank: catInput.display_order ?? 0,
      parent_category_id: parentCategoryId,
      metadata: {
        ...(catInput.metadata || {}),
        ...(catInput.image_id ? { image_id: catInput.image_id } : {}),
      },
    })

    categoriesCreated++
    const resolved: ResolvedCategory = {
      id: created.id,
      slug: created.handle || slug,
      created: true,
    }
    categoryCacheBySlug.set(slug, resolved)
    categoryCacheById.set(resolved.id, resolved)
    return resolved
  }

  async function findOrCreateBrand(
    brandInput: BulkImportBrandInputType
  ): Promise<ResolvedBrand> {
    if (!brandService) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Brand module is not registered in container."
      )
    }

    if (brandInput.id) {
      const cached = brandCacheById.get(brandInput.id)
      if (cached) return cached

      const existing = await brandService
        .retrieveBrand(brandInput.id)
        .catch(() => null)
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Brand with ID '${brandInput.id}' does not exist.`
        )
      }
      const resolved: ResolvedBrand = {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        created: false,
      }
      brandCacheById.set(resolved.id, resolved)
      if (resolved.slug) {
        brandCacheBySlug.set(resolved.slug.toLowerCase(), resolved)
      }
      return resolved
    }

    const slug = (brandInput.slug || toHandle(brandInput.name!))
      .trim()
      .toLowerCase()
    if (!slug) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Brand slug or name is required."
      )
    }

    const cached = brandCacheBySlug.get(slug)
    if (cached) return cached

    const existingList = await brandService.listBrands({ slug })
    const existing = Array.isArray(existingList) ? existingList[0] : null
    if (existing) {
      const resolved: ResolvedBrand = {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        created: false,
      }
      brandCacheBySlug.set(slug, resolved)
      brandCacheById.set(resolved.id, resolved)
      return resolved
    }

    if (dryRun) {
      brandsCreated++
      const simulated: ResolvedBrand = {
        id: `dry_brand_${slug}`,
        name: (brandInput.name || slug).trim(),
        slug,
        created: true,
      }
      brandCacheBySlug.set(slug, simulated)
      return simulated
    }

    const created = await brandService.createBrands({
      name: (brandInput.name || slug).trim(),
      slug,
      description: brandInput.description || null,
      logo_id: brandInput.logo_id || null,
      is_active: brandInput.is_active ?? true,
      metadata: brandInput.metadata || null,
    })

    brandsCreated++
    const resolved: ResolvedBrand = {
      id: created.id,
      name: created.name,
      slug: created.slug,
      created: true,
    }
    brandCacheBySlug.set(slug, resolved)
    brandCacheById.set(resolved.id, resolved)
    return resolved
  }

  async function findExistingProductByHandle(handle: string): Promise<any | null> {
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "metadata",
        "options.id",
        "options.title",
        "options.values.value",
        "variants.id",
        "variants.sku",
        "variants.title",
        "variants.metadata",
        "variants.manage_inventory",
        "variants.options.value",
        "variants.options.option_id",
        "categories.id",
      ],
      filters: { handle },
    })
    return data?.[0] ?? null
  }

  async function assertNoCrossProductSkuConflict(
    variants: NormalizedVariant[],
    ownProductId?: string
  ): Promise<void> {
    const skus = variants
      .map((v) => v.sku)
      .filter((sku): sku is string => Boolean(sku))
    if (skus.length === 0) {
      return
    }

    const { data: conflictingVariants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "product_id"],
      filters: { sku: skus },
    })

    for (const found of conflictingVariants ?? []) {
      if (ownProductId && found?.product_id === ownProductId) {
        continue
      }
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `SKU '${found.sku}' already belongs to product '${found.product_id}'.`
      )
    }
  }

  async function syncProductOptions(
    productId: string,
    existingOptions: any[],
    desiredOptions: Array<{ title: string; values: string[] }>
  ): Promise<void> {
    const existingByTitle = new Map<string, any>(
      (existingOptions ?? []).map((opt) => [String(opt.title), opt])
    )

    const optionsToCreate: Array<{
      product_id: string
      title: string
      values: string[]
    }> = []

    for (const desired of desiredOptions) {
      const existingOpt = existingByTitle.get(desired.title)
      if (!existingOpt) {
        optionsToCreate.push({
          product_id: productId,
          title: desired.title,
          values: desired.values,
        })
        continue
      }

      const existingValues = new Set<string>(
        (existingOpt.values ?? []).map((v: any) => String(v.value))
      )
      const missingValues = desired.values.filter((v) => !existingValues.has(v))
      if (missingValues.length > 0) {
        await updateProductOptionsWorkflow(scope).run({
          input: {
            selector: { id: existingOpt.id },
            update: {
              values: Array.from(new Set([...existingValues, ...missingValues])),
            },
          },
        })
      }
    }

    if (optionsToCreate.length > 0) {
      await createProductOptionsWorkflow(scope).run({
        input: {
          product_options: optionsToCreate,
        },
      })
    }
  }

  const seenHandles = new Set<string>()
  const seenSkus = new Set<string>()
  const importRunId = `bulk_${Date.now()}`

  const summary = {
    total: input.products.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    categories_created: 0,
    brands_created: 0,
  }
  const results: BulkImportItemResult[] = []

  for (let index = 0; index < input.products.length; index++) {
    const productInput = input.products[index]
    const fallbackHandle = (
      productInput.handle ||
      toHandle(productInput.title) ||
      `item-${index}`
    )
      .trim()
      .toLowerCase()

    const itemResult: BulkImportItemResult = {
      index,
      handle: fallbackHandle,
      title: productInput.title,
      status: "failed",
      product_id: null,
      category_ids: [],
      brand_id: null,
      variants_created: 0,
      variants_updated: 0,
      warnings: [],
      errors: [],
    }

    try {
      const normalized = normalizeProductStructure(productInput, priceUnit)
      itemResult.handle = normalized.handle
      itemResult.title = normalized.title

      if (seenHandles.has(normalized.handle)) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `Duplicate product handle '${normalized.handle}' within bulk import payload.`
        )
      }
      seenHandles.add(normalized.handle)

      for (const variant of normalized.variants) {
        if (variant.sku) {
          if (seenSkus.has(variant.sku)) {
            throw new MedusaError(
              MedusaError.Types.DUPLICATE_ERROR,
              `Duplicate SKU '${variant.sku}' within bulk import payload.`
            )
          }
          seenSkus.add(variant.sku)
        }
      }

      const imageFields = resolveProductImages(productInput)

      // Resolve categories (supports single `category` or `categories` array)
      const catInputs: BulkImportCategoryInputType[] = [
        ...(productInput.category ? [productInput.category] : []),
        ...(productInput.categories ?? []),
      ]
      const resolvedCategories: ResolvedCategory[] = []
      for (const catInput of catInputs) {
        const resolved = await findOrCreateCategory(catInput)
        if (!resolvedCategories.some((c) => c.id === resolved.id)) {
          resolvedCategories.push(resolved)
        }
      }
      itemResult.category_ids = resolvedCategories.map((c) => c.id)

      // Resolve brand
      let resolvedBrand: ResolvedBrand | null = null
      if (productInput.brand) {
        resolvedBrand = await findOrCreateBrand(productInput.brand)
        itemResult.brand_id = resolvedBrand.id
      }

      const { tagLabels, tagIds } = collectTags(productInput.tags)

      const existingProduct = await findExistingProductByHandle(
        normalized.handle
      )

      await assertNoCrossProductSkuConflict(
        normalized.variants,
        existingProduct?.id
      )

      const mergedMetadata: Record<string, unknown> = {
        ...(existingProduct?.metadata &&
        typeof existingProduct.metadata === "object"
          ? existingProduct.metadata
          : {}),
        ...(productInput.metadata && typeof productInput.metadata === "object"
          ? productInput.metadata
          : {}),
        ...(resolvedCategories[0]
          ? { category_id: resolvedCategories[0].id }
          : {}),
        ...(resolvedBrand
          ? {
              brand_id: resolvedBrand.id,
              brand_slug: resolvedBrand.slug,
              brand: resolvedBrand.name,
            }
          : {}),
        ...(tagLabels.length > 0 ? { tags: tagLabels } : {}),
        ...(productInput.specifications !== undefined
          ? { specifications: productInput.specifications }
          : {}),
        ...(productInput.color_hex_map !== undefined
          ? { color_hex_map: productInput.color_hex_map }
          : {}),
      }

      if (!existingProduct) {
        if (dryRun) {
          itemResult.status = "would_create"
          itemResult.variants_created = normalized.variants.length
          summary.created++
          results.push(itemResult)
          continue
        }

        const createPayload: Record<string, any> = {
          title: normalized.title,
          subtitle: normalized.subtitle ?? undefined,
          description: normalized.description ?? undefined,
          handle: normalized.handle,
          status: normalized.status,
          ...imageFields,
          ...(resolvedCategories.length > 0
            ? { categories: resolvedCategories.map((c) => ({ id: c.id })) }
            : {}),
          ...(tagIds.length > 0 ? { tags: tagIds } : {}),
          options: normalized.options,
          variants: normalized.variants.map((v) => ({
            title: v.title,
            ...(v.sku ? { sku: v.sku } : {}),
            ...(v.barcode !== undefined ? { barcode: v.barcode } : {}),
            ...(v.ean !== undefined ? { ean: v.ean } : {}),
            ...(v.upc !== undefined ? { upc: v.upc } : {}),
            manage_inventory: v.manageInventory,
            allow_backorder: v.allowBackorder,
            prices: [{ amount: v.priceIrr, currency_code: "irr" }],
            options: v.options,
            metadata: v.metadata,
          })),
          metadata: mergedMetadata,
        }

        const { result } = await createProductsWorkflow(scope).run({
          input: { products: [createPayload as any] },
        })
        const createdProduct = result[0]
        await ensureProductDefaultInventoryAndChannel(scope, createdProduct.id)

        itemResult.status = "created"
        itemResult.product_id = createdProduct.id
        itemResult.variants_created = normalized.variants.length
        summary.created++
        results.push(itemResult)
        continue
      }

      // Existing product matched by handle
      itemResult.product_id = existingProduct.id

      if (mode === "skip") {
        itemResult.status = dryRun ? "would_skip" : "skipped"
        summary.skipped++
        results.push(itemResult)
        continue
      }

      if (mode === "create_only") {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `Product with handle '${normalized.handle}' already exists (mode=create_only).`
        )
      }

      // mode === "upsert"
      const optionTitleById = new Map<string, string>(
        (existingProduct.options ?? []).map((opt: any) => [
          String(opt.id),
          String(opt.title),
        ])
      )
      const existingVariants: any[] = existingProduct.variants ?? []

      const matchedUpdates: Array<{
        existingVariant: any
        incoming: NormalizedVariant
      }> = []
      const newVariants: NormalizedVariant[] = []

      for (const incoming of normalized.variants) {
        const matched = matchExistingVariant(
          incoming,
          existingVariants,
          optionTitleById,
          normalized.isSimpleSingleVariant
        )
        if (matched) {
          matchedUpdates.push({ existingVariant: matched, incoming })
        } else {
          newVariants.push(incoming)
        }
      }

      if (dryRun) {
        itemResult.status = "would_update"
        itemResult.variants_updated = matchedUpdates.length
        itemResult.variants_created = newVariants.length
        summary.updated++
        results.push(itemResult)
        continue
      }

      const updateProductPayload: Record<string, any> = {
        title: normalized.title,
        ...(normalized.subtitle !== undefined
          ? { subtitle: normalized.subtitle }
          : {}),
        ...(normalized.description !== undefined
          ? { description: normalized.description }
          : {}),
        status: normalized.status,
        ...imageFields,
        ...(resolvedCategories.length > 0
          ? { categories: resolvedCategories.map((c) => ({ id: c.id })) }
          : {}),
        ...(tagIds.length > 0 ? { tags: tagIds } : {}),
        metadata: mergedMetadata,
      }

      await updateProductsWorkflow(scope).run({
        input: {
          selector: { id: existingProduct.id },
          update: updateProductPayload,
        },
      })

      await syncProductOptions(
        existingProduct.id,
        existingProduct.options ?? [],
        normalized.options
      )

      if (matchedUpdates.length > 0) {
        await updateProductVariantsWorkflow(scope).run({
          input: {
            product_variants: matchedUpdates.map(({ existingVariant, incoming }) => {
              const existingMeta =
                existingVariant.metadata &&
                typeof existingVariant.metadata === "object"
                  ? existingVariant.metadata
                  : {}
              const mergedVariantMeta: Record<string, unknown> = {
                ...existingMeta,
                ...incoming.metadata,
                ...(incoming.hasExplicitStock
                  ? { initial_stock: incoming.stock }
                  : {}),
              }
              if (
                incoming.hasExplicitCompareAt &&
                (incoming.compareAtIrr === null || incoming.compareAtIrr <= 0)
              ) {
                mergedVariantMeta.compare_at_price = null
              }
              return {
                id: existingVariant.id,
                title: incoming.title,
                ...(incoming.sku ? { sku: incoming.sku } : {}),
                ...(incoming.barcode !== undefined
                  ? { barcode: incoming.barcode }
                  : {}),
                ...(incoming.ean !== undefined ? { ean: incoming.ean } : {}),
                ...(incoming.upc !== undefined ? { upc: incoming.upc } : {}),
                manage_inventory: incoming.manageInventory,
                allow_backorder: incoming.allowBackorder,
                options: incoming.options,
                prices: [{ amount: incoming.priceIrr, currency_code: "irr" }],
                metadata: mergedVariantMeta,
              }
            }),
          },
        })

        for (const { existingVariant, incoming } of matchedUpdates) {
          if (incoming.hasExplicitStock && incoming.manageInventory) {
            await adjustVariantInventory(scope, {
              product_id: existingProduct.id,
              variant_id: existingVariant.id,
              quantity: incoming.stock,
              reason: "bulk_import",
              note: `Bulk import upsert (${normalized.handle})`,
              reference_type: "bulk_import",
              reference_id: importRunId,
              actor_id: actorId,
              recordTransactionIfUnchanged: false,
            })
          }
        }
      }

      if (newVariants.length > 0) {
        await createProductVariantsWorkflow(scope).run({
          input: {
            product_variants: newVariants.map((v) => ({
              product_id: existingProduct.id,
              title: v.title,
              ...(v.sku ? { sku: v.sku } : {}),
              ...(v.barcode !== undefined ? { barcode: v.barcode } : {}),
              ...(v.ean !== undefined ? { ean: v.ean } : {}),
              ...(v.upc !== undefined ? { upc: v.upc } : {}),
              manage_inventory: v.manageInventory,
              allow_backorder: v.allowBackorder,
              options: v.options,
              prices: [{ amount: v.priceIrr, currency_code: "irr" }],
              metadata: v.metadata,
            })),
          },
        })
      }

      // Ensures Sales Channel link and provisions InventoryLevel for any newly added variants
      await ensureProductDefaultInventoryAndChannel(scope, existingProduct.id)

      itemResult.status = "updated"
      itemResult.variants_updated = matchedUpdates.length
      itemResult.variants_created = newVariants.length
      summary.updated++
      results.push(itemResult)
    } catch (err: any) {
      itemResult.status = "failed"
      itemResult.errors.push(err?.message || "Unexpected bulk import error")
      summary.failed++
      results.push(itemResult)
    }
  }

  summary.categories_created = categoriesCreated
  summary.brands_created = brandsCreated

  return {
    dry_run: dryRun,
    mode,
    price_unit: priceUnit,
    download_images: downloadImages,
    summary,
    warnings,
    results,
  }
}
