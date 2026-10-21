import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const StoreGetCategoriesParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
    parent_category_id: z.string().nullable().optional(),
  })
)

export type StoreGetCategoriesParamsType = z.infer<
  typeof StoreGetCategoriesParams
>
