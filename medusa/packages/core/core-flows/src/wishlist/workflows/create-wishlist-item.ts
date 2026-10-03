import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { createWishlistItemStep } from "../steps/create-wishlist-item"

export type CreateWishlistItemWorkflowInput = {
  customer_id: string
  product_id: string
  variant_id?: string | null
}

export const createWishlistItemWorkflowId = "create-wishlist-item"

export const createWishlistItemWorkflow = createWorkflow(
  createWishlistItemWorkflowId,
  (input: WorkflowData<CreateWishlistItemWorkflowInput>) => {
    const item = createWishlistItemStep(input)

    const eventData = transform({ item }, ({ item }) => ({
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
    }))

    emitEventStep({
      eventName: "wishlist.item_added",
      data: eventData,
    })

    return new WorkflowResponse(item)
  }
)
