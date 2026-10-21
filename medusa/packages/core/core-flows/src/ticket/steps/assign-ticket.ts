import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type AssignTicketStepInput = {
  ticket_id: string
  assigned_to: string | null
  actor_id: string
}

export const assignTicketStepId = "assign-ticket-step"

export const assignTicketStep = createStep(
  assignTicketStepId,
  async (input: AssignTicketStepInput, { container }) => {
    const { ticket_id, assigned_to, actor_id } = input

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

    const oldAssignedTo = ticket.assigned_to

    const [updatedTicket] = await ticketService.updateTickets([
      { id: ticket.id, assigned_to },
    ])

    await ticketService.createTicketHistories([
      {
        ticket_id: ticket.id,
        actor_id,
        action: "operator_assigned",
        old_value: oldAssignedTo || null,
        new_value: assigned_to || null,
      },
    ])

    return new StepResponse(updatedTicket, {
      ticket_id: ticket.id,
      old_assigned_to: oldAssignedTo,
    })
  },
  async (rollbackData, { container }) => {
    if (!rollbackData) return
    const ticketService = container.resolve(Modules.TICKET) as any
    await ticketService.updateTickets([
      { id: rollbackData.ticket_id, assigned_to: rollbackData.old_assigned_to },
    ])
  }
)
