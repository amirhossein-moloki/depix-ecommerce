import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  ReorderProductVideosStepInput,
  reorderProductVideosStep,
} from "../steps/reorder-product-videos"

export const reorderProductVideosWorkflowId = "reorder-product-videos"

export const reorderProductVideosWorkflow = createWorkflow(
  reorderProductVideosWorkflowId,
  (input: WorkflowData<ReorderProductVideosStepInput>) => {
    const videos = reorderProductVideosStep(input)

    const eventData = transform({ input }, ({ input }) => ({
      product_id: input.product_id,
      video_ids: input.video_ids,
    }))

    emitEventStep({
      eventName: "product_video.reordered",
      data: eventData,
    })

    return new WorkflowResponse(videos)
  }
)
