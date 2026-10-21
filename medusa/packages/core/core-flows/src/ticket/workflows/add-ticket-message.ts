import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import {
  AddTicketMessageStepInput,
  addTicketMessageStep,
} from "../steps/add-ticket-message"

export const addTicketMessageWorkflowId = "add-ticket-message"

export const addTicketMessageWorkflow = createWorkflow(
  addTicketMessageWorkflowId,
  (input: WorkflowData<AddTicketMessageStepInput>) => {
    const message = addTicketMessageStep(input)

    const eventData = transform({ message, input }, ({ message, input }) => ({
      id: message.id,
      ticket_id: message.ticket_id,
      sender_id: message.sender_id,
      sender_type: message.sender_type,
      is_internal_note: message.is_internal_note,
    }))

    emitEventStep({
      eventName: "ticket.message_created",
      data: eventData,
    })

    return new WorkflowResponse(message)
  }
)
