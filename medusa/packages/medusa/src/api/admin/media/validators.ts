import { z } from "@medusajs/framework/zod"
import { createFindParams } from "../../utils/validators"

export const AdminGetMediaParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
    mime_type: z.string().optional(),
    uploaded_by_id: z.string().optional(),
    order: z.enum(["created_at", "-created_at", "ASC", "DESC"]).optional(),
  })
)

export type AdminGetMediaParamsType = z.infer<typeof AdminGetMediaParams>
