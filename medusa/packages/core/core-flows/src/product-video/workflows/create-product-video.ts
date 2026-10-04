import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  CreateProductVideoStepInput,
  createProductVideoStep,
} from "../steps/create-product-video"

export const createProductVideoWorkflowId = "create-product-video"

export const createProductVideoWorkflow = createWorkflow(
  createProductVideoWorkflowId,
  (input: WorkflowData<CreateProductVideoStepInput>) => {
    const video = createProductVideoStep(input)

    const eventData = transform({ video }, ({ video }) => ({
      id: video.id,
      product_id: video.product_id,
      variant_id: video.variant_id,
      provider: video.provider,
      status: video.status,
    }))

    emitEventStep({
      eventName: "product_video.created",
      data: eventData,
    })

    return new WorkflowResponse(video)
  }
)
