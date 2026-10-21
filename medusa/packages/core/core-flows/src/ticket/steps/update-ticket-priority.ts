import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type UpdateTicketPriorityStepInput = {
  ticket_id: string
  priority: "low" | "normal" | "high"
  actor_id: string
}

export const updateTicketPriorityStepId = "update-ticket-priority-step"

export const updateTicketPriorityStep = createStep(
  updateTicketPriorityStepId,
  async (input: UpdateTicketPriorityStepInput, { container }) => {
    const { ticket_id, priority, actor_id } = input

    const validPriorities = ["low", "normal", "high"]

    if (!validPriorities.includes(priority)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid priority: ${priority}. Allowed: ${validPriorities.join(", ")}`
      )
    }

    const ticketService = container.resolve(Modules.TICKET) as any

    const [ticket] = await ticketService.listTickets(
      { id: ticket_id },
      { take: 1 }
    )

    if (!ticket) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Ticket with id ${ticket_id} was not found`
      )
    }

    const oldPriority = ticket.priority
    if (oldPriority === priority) {
      return new StepResponse(ticket, null)
    }

    const [updatedTicket] = await ticketService.updateTickets([
      { id: ticket.id, priority },
    ])

    await ticketService.createTicketHistories([
      {
        ticket_id: ticket.id,
        actor_id,
        action: "priority_changed",
        old_value: oldPriority,
        new_value: priority,
      },
    ])

    return new StepResponse(updatedTicket, {
      ticket_id: ticket.id,
      old_priority: oldPriority,
    })
  },
  async (rollbackData, { container }) => {
    if (!rollbackData) return
    const ticketService = container.resolve(Modules.TICKET) as any
    await ticketService.updateTickets([
      { id: rollbackData.ticket_id, priority: rollbackData.old_priority },
    ])
  }
)
