import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { createStockAlertStep } from "../steps/create-stock-alert"

export type CreateStockAlertWorkflowInput = {
  customer_id: string
  product_id: string
  variant_id: string
  channel?: string
  metadata?: Record<string, unknown> | null
}

export const createStockAlertWorkflowId = "create-stock-alert"

export const createStockAlertWorkflow = createWorkflow(
  createStockAlertWorkflowId,
  (input: WorkflowData<CreateStockAlertWorkflowInput>) => {
    const stockAlert = createStockAlertStep(input)

    const eventData = transform({ stockAlert }, ({ stockAlert }) => ({
      id: stockAlert.id,
      customer_id: stockAlert.customer_id,
      product_id: stockAlert.product_id,
      variant_id: stockAlert.variant_id,
      channel: stockAlert.channel,
      status: stockAlert.status,
    }))

    emitEventStep({
      eventName: "stock_alert.created",
      data: eventData,
    })

    return new WorkflowResponse(stockAlert)
  }
)
