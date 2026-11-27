import { addShippingMethodToCartWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { refetchCart } from "../../helpers"
import { defaultStoreCartFields } from "../../query-config"
import { isCartEligibleForFreeShipping } from "../../../shipping-options/free-shipping"
import {
  computeCartWeightAndValue,
  fetchPostexQuoteIrr,
  resolveOriginPostexCityCode,
  TABRIZ_COURIER_NOTE,
} from "./postex"

type ShippingMethodKind = "postex_post" | "tabriz_courier" | "standard"

async function resolveShippingOptionKind(
  scope: MedusaRequest["scope"],
  optionId: string
): Promise<{ kind: ShippingMethodKind; name?: string }> {
  if (optionId === "postex_post") {
    return { kind: "postex_post", name: "ارسال با پست (پستکس)" }
  }
  if (optionId === "tabriz_courier") {
    return { kind: "tabriz_courier", name: "ارسال داخل شهر تبریز (اسنپ / پیک)" }
  }

  try {
    const remoteQuery = scope.resolve<any>(ContainerRegistrationKeys.REMOTE_QUERY)
    if (typeof remoteQuery === "function") {
      const queryObj = remoteQueryObjectFromString({
        entryPoint: "shipping_option",
        variables: { filters: { id: optionId } },
        fields: ["id", "name", "provider_id", "data", "metadata"],
      })
      const [opt] = await remoteQuery(queryObj)
      const code =
        opt?.data?.code ?? opt?.metadata?.code ?? opt?.provider_id ?? ""
      if (code === "postex_post" || opt?.id === "postex_post") {
        return { kind: "postex_post", name: opt?.name }
      }
      if (code === "tabriz_courier" || opt?.id === "tabriz_courier") {
        return { kind: "tabriz_courier", name: opt?.name }
      }
      return { kind: "standard", name: opt?.name }
    }
  } catch {
    // Ignore lookup failure; treat as standard option
  }

  return { kind: "standard" }
}

export const POST = async (
  req: MedusaRequest<
    HttpTypes.StoreAddCartShippingMethods & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const payload = req.validatedBody
  const cartId = req.params.id
  const normalizedOptions = Array.isArray(payload) ? payload : [payload]

  const cartService = req.scope.resolve<any>(Modules.CART)
  const existingCart = await cartService
    .retrieveCart(cartId, {
      relations: ["items", "shipping_address", "shipping_methods"],
    })
    .catch(() => null)

  if (!existingCart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${cartId}' not found`
    )
  }

  const preparedOptions: Array<{
    id: string
    data?: Record<string, unknown>
    kind: ShippingMethodKind
    name?: string
    dynamicAmountIrr?: number
  }> = []

  let cartMetadataPatch: Record<string, unknown> | null = null

  for (const option of normalizedOptions) {
    const { kind, name } = await resolveShippingOptionKind(
      req.scope,
      option.option_id
    )
    const rawData = (option.data ?? {}) as Record<string, unknown>

    if (kind === "postex_post") {
      const rawCityCode =
        rawData.to_city_code ??
        rawData.city_code ??
        existingCart.shipping_address?.metadata?.city_code
      const toCityCode = Number(rawCityCode)

      if (!Number.isFinite(toCityCode) || toCityCode <= 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "کد شهر مقصد (to_city_code) برای محاسبه هزینه ارسال پستکس الزامی است."
        )
      }

      const { totalWeightGrams, totalValueIrr } =
        computeCartWeightAndValue(existingCart)
      const fromCityCode = await resolveOriginPostexCityCode(req.scope)

      const quotedAmountIrr = await fetchPostexQuoteIrr({
        fromCityCode,
        toCityCode,
        totalWeightGrams,
        totalValueIrr,
        courierCode:
          typeof rawData.courier_code === "string"
            ? rawData.courier_code
            : undefined,
        boxSizeId:
          rawData.box_size_id !== undefined
            ? Number(rawData.box_size_id)
            : undefined,
      })

      const isFreeShipping = await isCartEligibleForFreeShipping(
        req.scope,
        cartId
      )
      const finalAmountIrr = isFreeShipping ? 0 : quotedAmountIrr

      cartMetadataPatch = {
        shipping_method_code: "postex_post",
        shipping_payment_type: "prepaid",
        shipping_note: null,
      }

      preparedOptions.push({
        id: option.option_id,
        kind,
        name: name || "ارسال با پست (پستکس)",
        dynamicAmountIrr: finalAmountIrr,
        data: {
          ...rawData,
          code: "postex_post",
          to_city_code: toCityCode,
          quoted_amount_irr: quotedAmountIrr,
          is_free_shipping: isFreeShipping,
        },
      })
    } else if (kind === "tabriz_courier") {
      cartMetadataPatch = {
        shipping_method_code: "tabriz_courier",
        shipping_payment_type: "pay_on_delivery",
        shipping_note: TABRIZ_COURIER_NOTE,
      }

      preparedOptions.push({
        id: option.option_id,
        kind,
        name: name || "ارسال داخل شهر تبریز (اسنپ / پیک)",
        dynamicAmountIrr: 0,
        data: {
          ...rawData,
          code: "tabriz_courier",
          payment_type: "pay_on_delivery",
          shipping_note: TABRIZ_COURIER_NOTE,
        },
      })
    } else {
      if (existingCart.metadata?.shipping_method_code === "tabriz_courier") {
        cartMetadataPatch = {
          shipping_method_code: null,
          shipping_payment_type: null,
          shipping_note: null,
        }
      }

      preparedOptions.push({
        id: option.option_id,
        kind,
        name,
        data: option.data,
      })
    }
  }

  let workflowSucceeded = false
  try {
    await addShippingMethodToCartWorkflow(req.scope).run({
      input: {
        options: preparedOptions.map((o) => ({ id: o.id, data: o.data })),
        cart_id: cartId,
        additional_data: payload.additional_data,
      },
    })
    workflowSucceeded = true
  } catch (err) {
    const hasCustomCodeOption = preparedOptions.some(
      (o) => o.kind === "postex_post" || o.kind === "tabriz_courier"
    )
    if (!hasCustomCodeOption) {
      throw err
    }
  }

  if (!workflowSucceeded) {
    // Fallback when postex_post / tabriz_courier is passed without a pre-seeded DB shipping_option row
    const existingMethods = existingCart.shipping_methods ?? []
    if (existingMethods.length > 0 && typeof cartService.deleteShippingMethods === "function") {
      await cartService.deleteShippingMethods(
        existingMethods.map((m: any) => m.id).filter(Boolean)
      )
    }
    await cartService.addShippingMethods(
      cartId,
      preparedOptions.map((o) => ({
        name: o.name || o.id,
        amount: o.dynamicAmountIrr ?? 0,
        shipping_option_id: o.id,
        data: o.data,
      }))
    )
  } else {
    // Sync dynamic amounts (e.g. Postex quote or Tabriz courier 0 IRR) onto the newly attached shipping method
    const dynamicOptions = preparedOptions.filter(
      (o) => o.dynamicAmountIrr !== undefined
    )
    if (
      dynamicOptions.length > 0 &&
      typeof cartService.updateShippingMethods === "function"
    ) {
      const refreshed = await cartService
        .retrieveCart(cartId, { relations: ["shipping_methods"] })
        .catch(() => null)
      const methods = refreshed?.shipping_methods ?? []
      const updates: Array<{ id: string; amount: number; data?: Record<string, unknown> }> = []
      for (const opt of dynamicOptions) {
        const matched = methods.find(
          (m: any) => m.shipping_option_id === opt.id
        )
        if (matched?.id) {
          updates.push({
            id: matched.id,
            amount: opt.dynamicAmountIrr!,
            data: opt.data,
          })
        }
      }
      if (updates.length > 0) {
        await cartService.updateShippingMethods(updates)
      }
    }
  }

  if (cartMetadataPatch && typeof cartService.updateCarts === "function") {
    await cartService.updateCarts(cartId, {
      metadata: {
        ...(existingCart.metadata ?? {}),
        ...cartMetadataPatch,
      },
    })
  }

  const fields =
    req.queryConfig?.fields && req.queryConfig.fields.length > 0
      ? req.queryConfig.fields
      : defaultStoreCartFields

  const cart = await refetchCart(cartId, req.scope, fields)

  res.status(200).json({ cart })
}
