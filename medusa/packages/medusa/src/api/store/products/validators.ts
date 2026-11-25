import { z } from "@medusajs/framework/zod"
import { booleanString } from "../../utils/common-validators/common"
import {
  applyAndAndOrOperators,
  GetProductsParams,
  recursivelyNormalizeSchema,
  StoreGetProductParamsDirectFields,
  transformProductParams,
} from "../../utils/common-validators"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../utils/validators"

export const StoreGetProductParamsFields = z.object({
  region_id: z.string().optional(),
  country_code: z.string().optional(),
  province: z.string().optional(),
  cart_id: z.string().optional(),
})

export type StoreGetProductParamsType = z.infer<typeof StoreGetProductParams>

export const StoreGetProductParams = createSelectParams().merge(
  StoreGetProductParamsFields
)

export const StoreGetProductVariantsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.union([z.string(), z.array(z.string())]).optional(),
  ean: z.union([z.string(), z.array(z.string())]).optional(),
  upc: z.union([z.string(), z.array(z.string())]).optional(),
  barcode: z.union([z.string(), z.array(z.string())]).optional(),
    
  options: z
    .object({ value: z.string().optional(), option_id: z.string().optional() })
    .optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

const optionalNonNegativeNumber = () =>
  z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().nonnegative().optional()
  )

export const StoreGetProductsParamsFields = z
  .object({
    region_id: z.string().optional(),
    country_code: z.string().optional(),
    province: z.string().optional(),
    cart_id: z.string().optional(),
    brand_id: z.union([z.string(), z.array(z.string())]).optional(),
    brand_slug: z.union([z.string(), z.array(z.string())]).optional(),
    min_price: optionalNonNegativeNumber(),
    max_price: optionalNonNegativeNumber(),
    in_stock: booleanString().optional(),
    has_discount: booleanString().optional(),
    sort: z
      .enum(["newest", "bestselling", "price_asc", "price_desc", "popular"])
      .optional(),
  })
  .merge(GetProductsParams)
  .strict()

export type StoreGetProductsParamsType = z.infer<typeof StoreGetProductsParams>
export const StoreGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreGetProductsParamsFields)
  .merge(
    z
      .object({
        variants: z
          .object({
            options: z
              .object({
                value: z.string().optional(),
                option_id: z.string().optional(),
              })
              .optional(),
          })
          .merge(applyAndAndOrOperators(StoreGetProductVariantsParamsFields))
          .optional(),
      })
      .merge(applyAndAndOrOperators(StoreGetProductParamsDirectFields))
      .strict()
  )
  .transform(recursivelyNormalizeSchema(transformProductParams) as any)
