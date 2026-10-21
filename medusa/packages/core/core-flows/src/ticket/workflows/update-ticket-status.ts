import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  UpdateTicketStatusStepInput,
  updateTicketStatusStep,
} from "../steps/update-ticket-status"

export const updateTicketStatusWorkflowId = "update-ticket-status"

export const updateTicketStatusWorkflow = createWorkflow(
  updateTicketStatusWorkflowId,
  (input: WorkflowData<UpdateTicketStatusStepInput>) => {
    const ticket = updateTicketStatusStep(input)

    const eventData = transform({ ticket }, ({ ticket }) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      user_id: ticket.user_id,
      status: ticket.status,
    }))

    emitEventStep({
      eventName: "ticket.status_updated",
      data: eventData,
    })

    return new WorkflowResponse(ticket)
  }
)
