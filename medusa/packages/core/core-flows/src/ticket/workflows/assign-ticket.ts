import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  AssignTicketStepInput,
  assignTicketStep,
} from "../steps/assign-ticket"

export const assignTicketWorkflowId = "assign-ticket"

export const assignTicketWorkflow = createWorkflow(
  assignTicketWorkflowId,
  (input: WorkflowData<AssignTicketStepInput>) => {
    const ticket = assignTicketStep(input)

    const eventData = transform({ ticket }, ({ ticket }) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      user_id: ticket.user_id,
      assigned_to: ticket.assigned_to,
    }))

    emitEventStep({
      eventName: "ticket.assigned",
      data: eventData,
    })

    return new WorkflowResponse(ticket)
  }
)
