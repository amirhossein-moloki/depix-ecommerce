import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { removeWishlistItemStep } from "../steps/remove-wishlist-item"

export type RemoveWishlistItemWorkflowInput = {
  customer_id: string
  wishlist_item_id: string
}

export const removeWishlistItemWorkflowId = "remove-wishlist-item"

export const removeWishlistItemWorkflow = createWorkflow(
  removeWishlistItemWorkflowId,
  (input: WorkflowData<RemoveWishlistItemWorkflowInput>) => {
    const result = removeWishlistItemStep(input)

    const eventData = transform({ input }, ({ input }) => ({
      customer_id: input.customer_id,
      wishlist_item_id: input.wishlist_item_id,
    }))

    emitEventStep({
      eventName: "wishlist.item_removed",
      data: eventData,
    })

    return new WorkflowResponse(result)
  }
)
