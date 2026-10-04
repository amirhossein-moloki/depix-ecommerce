import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  DeleteProductVideoStepInput,
  deleteProductVideoStep,
} from "../steps/delete-product-video"

export const deleteProductVideoWorkflowId = "delete-product-video"

export const deleteProductVideoWorkflow = createWorkflow(
  deleteProductVideoWorkflowId,
  (input: WorkflowData<DeleteProductVideoStepInput>) => {
    const res = deleteProductVideoStep(input)

    const eventData = transform({ res }, ({ res }) => ({
      id: res.id,
      product_id: res.product_id,
      deleted: true,
    }))

    emitEventStep({
      eventName: "product_video.deleted",
      data: eventData,
    })

    return new WorkflowResponse(res)
  }
)
