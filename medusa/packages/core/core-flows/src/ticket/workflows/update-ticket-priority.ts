import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  UpdateTicketPriorityStepInput,
  updateTicketPriorityStep,
} from "../steps/update-ticket-priority"

export const updateTicketPriorityWorkflowId = "update-ticket-priority"

export const updateTicketPriorityWorkflow = createWorkflow(
  updateTicketPriorityWorkflowId,
  (input: WorkflowData<UpdateTicketPriorityStepInput>) => {
    const ticket = updateTicketPriorityStep(input)

    const eventData = transform({ ticket }, ({ ticket }) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      user_id: ticket.user_id,
      priority: ticket.priority,
    }))

    emitEventStep({
      eventName: "ticket.priority_updated",
      data: eventData,
    })

    return new WorkflowResponse(ticket)
  }
)
