import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const StoreGetBrandsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
  })
)

export type StoreGetBrandsParamsType = z.infer<typeof StoreGetBrandsParams>
