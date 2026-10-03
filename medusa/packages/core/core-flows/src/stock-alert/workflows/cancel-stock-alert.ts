import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { cancelStockAlertStep } from "../steps/cancel-stock-alert"

export type CancelStockAlertWorkflowInput = {
  id: string
  customer_id: string
}

export const cancelStockAlertWorkflowId = "cancel-stock-alert"

export const cancelStockAlertWorkflow = createWorkflow(
  cancelStockAlertWorkflowId,
  (input: WorkflowData<CancelStockAlertWorkflowInput>) => {
    const stockAlert = cancelStockAlertStep(input)

    const eventData = transform({ stockAlert }, ({ stockAlert }) => ({
      id: stockAlert.id,
      customer_id: stockAlert.customer_id,
      product_id: stockAlert.product_id,
      variant_id: stockAlert.variant_id,
      status: stockAlert.status,
    }))

    emitEventStep({
      eventName: "stock_alert.cancelled",
      data: eventData,
    })

    return new WorkflowResponse(stockAlert)
  }
)
