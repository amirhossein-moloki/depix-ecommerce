import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  CreateTicketStepInput,
  createTicketStep,
} from "../steps/create-ticket"

export const createTicketWorkflowId = "create-ticket"

export const createTicketWorkflow = createWorkflow(
  createTicketWorkflowId,
  (input: WorkflowData<CreateTicketStepInput>) => {
    const ticket = createTicketStep(input)

    const eventData = transform({ ticket }, ({ ticket }) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      user_id: ticket.user_id,
      category_id: ticket.category_id,
      status: ticket.status,
      priority: ticket.priority,
    }))

    emitEventStep({
      eventName: "ticket.created",
      data: eventData,
    })

    return new WorkflowResponse(ticket)
  }
)
