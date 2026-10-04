import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { createInvoiceStep } from "../steps/create-invoice"

export type CreateInvoiceWorkflowInput = {
  order_id: string
}

export const createInvoiceWorkflowId = "create-invoice"

export const createInvoiceWorkflow = createWorkflow(
  createInvoiceWorkflowId,
  (input: WorkflowData<CreateInvoiceWorkflowInput>) => {
    const invoice = createInvoiceStep(input)

    const eventData = transform({ invoice }, ({ invoice }) => ({
      id: invoice.id,
      order_id: invoice.order_id,
      invoice_number: invoice.invoice_number,
    }))

    emitEventStep({
      eventName: "invoice.created",
      data: eventData,
    })

    return new WorkflowResponse(invoice)
  }
)
