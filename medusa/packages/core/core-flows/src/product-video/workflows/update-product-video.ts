import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  UpdateProductVideoStepInput,
  updateProductVideoStep,
} from "../steps/update-product-video"

export const updateProductVideoWorkflowId = "update-product-video"

export const updateProductVideoWorkflow = createWorkflow(
  updateProductVideoWorkflowId,
  (input: WorkflowData<UpdateProductVideoStepInput>) => {
    const video = updateProductVideoStep(input)

    const eventData = transform({ video }, ({ video }) => ({
      id: video.id,
      product_id: video.product_id,
      variant_id: video.variant_id,
      provider: video.provider,
      status: video.status,
    }))

    emitEventStep({
      eventName: "product_video.updated",
      data: eventData,
    })

    return new WorkflowResponse(video)
  }
)
