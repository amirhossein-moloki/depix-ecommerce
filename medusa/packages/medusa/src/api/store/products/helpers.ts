import { refetchEntity } from "@medusajs/framework/http"
import {
  HttpTypes,
  ItemTaxLineDTO,
  MedusaContainer,
  TaxableItemDTO,
} from "@medusajs/framework/types"
import {
  applyTranslationsToTaxLines,
  calculateAmountsWithTax,
  ContainerRegistrationKeys,
  FeatureFlag,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { StoreRequestWithContext } from "../types"
import TranslationFeatureFlag from "../../../feature-flags/translation"

export type RequestWithContext<
  Body,
  QueryFields = Record<string, unknown>
> = StoreRequestWithContext<Body, QueryFields>

export const refetchProduct = async (
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[]
) => {
  return await refetchEntity({ entity: "product", idOrFilter, scope, fields })
}

export const filterOutInternalProductCategories = (
  products: HttpTypes.StoreProduct[]
) => {
  return products.forEach((product: HttpTypes.StoreProduct) => {
    if (!product.categories) {
      return
    }

    product.categories = product.categories.filter(
      (category) =>
        !(category as HttpTypes.StoreProductCategory & { is_internal: boolean })
          .is_internal
    )
  })
}

export const wrapProductsWithTaxPrices = async <T>(
  req: RequestWithContext<T>,
  products: HttpTypes.StoreProduct[]
) => {
  // If we are missing the necessary context, we can't calculate the tax, so only `calculated_amount` will be available
  if (
    !req.taxContext?.taxInclusivityContext ||
    !req.taxContext?.taxLineContext
  ) {
    return
  }

  // If automatic taxes are not enabled, we should skip calculating any tax
  if (!req.taxContext.taxInclusivityContext.automaticTaxes) {
    return
  }

  const taxService = req.scope.resolve(Modules.TAX)

  let taxLines = (await taxService.getTaxLines(
    products.map(asTaxItem).flat(),
    req.taxContext.taxLineContext
  )) as unknown as ItemTaxLineDTO[]

  const isTranslationEnabled = FeatureFlag.isFeatureEnabled(
    TranslationFeatureFlag.key
  )
  if (isTranslationEnabled) {
    taxLines = (await applyTranslationsToTaxLines(
      taxLines,
      req.locale,
      req.scope
    )) as ItemTaxLineDTO[]
  }

  const taxRatesMap = new Map<string, ItemTaxLineDTO[]>()
  taxLines.forEach((taxRate) => {
    if (!taxRatesMap.has(taxRate.line_item_id)) {
      taxRatesMap.set(taxRate.line_item_id, [])
    }

    taxRatesMap.get(taxRate.line_item_id)?.push(taxRate)
  })

  products.forEach((product) => {
    product.variants?.forEach((variant) => {
      if (!variant.calculated_price) {
        return
      }

      const taxRatesForVariant = taxRatesMap.get(variant.id) || []
      const { priceWithTax, priceWithoutTax } = calculateAmountsWithTax({
        taxLines: taxRatesForVariant,
        amount: variant.calculated_price!.calculated_amount!,
        includesTax:
          variant.calculated_price!.is_calculated_price_tax_inclusive!,
      })

      variant.calculated_price.calculated_amount_with_tax = priceWithTax
      variant.calculated_price.calculated_amount_without_tax = priceWithoutTax

      const {
        priceWithTax: originalPriceWithTax,
        priceWithoutTax: originalPriceWithoutTax,
      } = calculateAmountsWithTax({
        taxLines: taxRatesForVariant,
        amount: variant.calculated_price!.original_amount!,
        includesTax: variant.calculated_price!.is_original_price_tax_inclusive!,
      })

      variant.calculated_price.original_amount_with_tax = originalPriceWithTax
      variant.calculated_price.original_amount_without_tax =
        originalPriceWithoutTax
    })
  })
}

const asTaxItem = (product: HttpTypes.StoreProduct): TaxableItemDTO[] => {
  return product.variants
    ?.map((variant) => {
      if (!variant.calculated_price) {
        return
      }

      return {
        id: variant.id,
        product_id: product.id,
        product_type_id: product.type_id,
        quantity: 1,
        unit_price: variant.calculated_price.calculated_amount,
        currency_code: variant.calculated_price.currency_code,
      }
    })
    .filter((v) => !!v) as unknown as TaxableItemDTO[]
}

const getVariantFinalPrice = (variant: any): number | null => {
  const calcAmount = variant?.calculated_price?.calculated_amount
  if (
    calcAmount !== undefined &&
    calcAmount !== null &&
    Number.isFinite(Number(calcAmount))
  ) {
    return Number(calcAmount)
  }

  if (Array.isArray(variant?.prices) && variant.prices.length > 0) {
    const irrPrice = variant.prices.find(
      (p: any) =>
        typeof p?.currency_code === "string" &&
        p.currency_code.toLowerCase() === "irr"
    )
    const chosen = irrPrice ?? variant.prices[0]
    if (
      chosen?.amount !== undefined &&
      chosen?.amount !== null &&
      Number.isFinite(Number(chosen.amount))
    ) {
      return Number(chosen.amount)
    }
  }

  return null
}

const getVariantRealPrice = (
  variant: any,
  finalPrice: number | null
): number | null => {
  const origAmount = variant?.calculated_price?.original_amount
  if (
    origAmount !== undefined &&
    origAmount !== null &&
    Number.isFinite(Number(origAmount)) &&
    (finalPrice === null || Number(origAmount) > finalPrice)
  ) {
    return Number(origAmount)
  }

  const compareAt = variant?.metadata?.compare_at_price
  if (
    compareAt !== undefined &&
    compareAt !== null &&
    Number.isFinite(Number(compareAt)) &&
    Number(compareAt) > 0
  ) {
    return Number(compareAt)
  }

  return finalPrice
}

/**
 * Enriches store product responses with computed `realPrice`, `finalPrice`,
 * `discount` (percentage), and `stock` (boolean) fields.
 */
export const enrichProductsWithStoreSummary = (products: any[]) => {
  for (const product of products ?? []) {
    const variants = Array.isArray(product?.variants) ? product.variants : []

    let bestVariant: any = null
    let bestFinalPrice: number | null = null

    for (const variant of variants) {
      const price = getVariantFinalPrice(variant)
      if (price !== null && (bestFinalPrice === null || price < bestFinalPrice)) {
        bestFinalPrice = price
        bestVariant = variant
      }
    }

    if (!bestVariant && variants.length > 0) {
      bestVariant = variants[0]
    }

    const finalPrice = bestFinalPrice
    const realPrice = bestVariant
      ? getVariantRealPrice(bestVariant, finalPrice)
      : null

    let discount = 0
    if (
      realPrice !== null &&
      finalPrice !== null &&
      realPrice > finalPrice &&
      realPrice > 0
    ) {
      discount = Math.round(((realPrice - finalPrice) / realPrice) * 100)
    } else if (Number(product?.metadata?.discount_percentage ?? 0) > 0) {
      discount = Number(product.metadata.discount_percentage)
    }

    const stock = variants.some((variant: any) => {
      if (variant?.manage_inventory === false || variant?.allow_backorder === true) {
        return true
      }
      if (variant?.inventory_quantity !== undefined && variant?.inventory_quantity !== null) {
        return Number(variant.inventory_quantity) > 0
      }
      return Number(variant?.metadata?.initial_stock ?? 0) > 0
    })

    product.realPrice = realPrice
    product.finalPrice = finalPrice
    product.discount = discount
    product.stock = stock
  }
}

function isPromotionTimeActive(promo: any, now: number): boolean {
  const startsAt = promo?.metadata?.starts_at ?? promo?.campaign?.starts_at
  const endsAt = promo?.metadata?.ends_at ?? promo?.campaign?.ends_at
  if (startsAt && new Date(startsAt).getTime() > now) {
    return false
  }
  if (endsAt && new Date(endsAt).getTime() < now) {
    return false
  }
  return true
}

function doesPromotionMatchProduct(promo: any, productId: string): boolean {
  const targetRules = promo?.application_method?.target_rules ?? []
  if (!Array.isArray(targetRules) || targetRules.length === 0) {
    return true
  }

  return targetRules.some((rule: any) => {
    const attr = String(rule?.attribute || "")
    if (
      attr !== "items.product.id" &&
      attr !== "product_id" &&
      attr !== "items.product_id"
    ) {
      return false
    }
    const values = (rule?.values ?? []).map((v: any) =>
      typeof v === "string" ? v : v?.value
    )
    const op = String(rule?.operator || "in").toLowerCase()
    if (op === "ne") {
      return !values.includes(productId)
    }
    return values.includes(productId)
  })
}

/**
 * Applies active automatic promotions (storewide or product-targeted) to product summary
 * fields (`realPrice`, `finalPrice`, `discount`) so product cards display discounts before checkout.
 */
export async function applyActiveAutomaticPromotionsToProducts(
  scope: MedusaContainer,
  products: any[]
): Promise<void> {
  if (!Array.isArray(products) || products.length === 0) {
    return
  }

  let promotions: any[] = []
  try {
    const remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY)
    if (typeof remoteQuery === "function") {
      const queryObj = remoteQueryObjectFromString({
        entryPoint: "promotion",
        variables: {
          filters: { status: "active", is_automatic: true },
          take: 100,
        },
        fields: [
          "id",
          "code",
          "status",
          "is_automatic",
          "metadata",
          "campaign.starts_at",
          "campaign.ends_at",
          "application_method.type",
          "application_method.value",
          "application_method.target_type",
          "application_method.target_rules.attribute",
          "application_method.target_rules.operator",
          "application_method.target_rules.values.value",
        ],
      })
      const result = await remoteQuery(queryObj)
      promotions = Array.isArray(result) ? result : result?.rows ?? []
    }
  } catch {
    return
  }

  const now = Date.now()
  const activePromos = promotions.filter(
    (p: any) =>
      p?.status === "active" &&
      p?.is_automatic === true &&
      p?.application_method &&
      isPromotionTimeActive(p, now)
  )

  if (activePromos.length === 0) {
    return
  }

  for (const product of products) {
    const basePrice = Number(product?.realPrice ?? product?.finalPrice ?? 0)
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      continue
    }

    let bestFinal = Number(product?.finalPrice ?? basePrice)
    for (const promo of activePromos) {
      if (!doesPromotionMatchProduct(promo, product.id)) {
        continue
      }

      const methodType = promo.application_method?.type
      const methodValue = Number(promo.application_method?.value ?? 0)
      if (!Number.isFinite(methodValue) || methodValue <= 0) {
        continue
      }

      let candidateFinal = basePrice
      if (methodType === "percentage") {
        candidateFinal = Math.max(
          0,
          Math.round(basePrice * (1 - methodValue / 100))
        )
      } else if (methodType === "fixed") {
        candidateFinal = Math.max(0, Math.round(basePrice - methodValue))
      }

      if (candidateFinal < bestFinal) {
        bestFinal = candidateFinal
      }
    }

    if (bestFinal < basePrice) {
      product.realPrice = basePrice
      product.finalPrice = bestFinal
      product.discount = Math.round(((basePrice - bestFinal) / basePrice) * 100)
    }
  }
}
