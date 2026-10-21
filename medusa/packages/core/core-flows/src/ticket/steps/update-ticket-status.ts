import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type UpdateTicketStatusStepInput = {
  ticket_id: string
  status: "open" | "in_progress" | "waiting_for_customer" | "answered" | "resolved" | "closed"
  actor_id: string
}

export const updateTicketStatusStepId = "update-ticket-status-step"

export const updateTicketStatusStep = createStep(
  updateTicketStatusStepId,
  async (input: UpdateTicketStatusStepInput, { container }) => {
    const { ticket_id, status, actor_id } = input

    const validStatuses = [
      "open",
      "in_progress",
      "waiting_for_customer",
      "answered",
      "resolved",
      "closed",
    ]

    if (!validStatuses.includes(status)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid status: ${status}. Allowed: ${validStatuses.join(", ")}`
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

    const oldStatus = ticket.status
    if (oldStatus === status) {
      return new StepResponse(ticket, null)
    }

    const updates: Record<string, any> = {
      status,
    }

    if (status === "closed") {
      updates.closed_at = new Date()
    } else if (oldStatus === "closed") {
      updates.closed_at = null
    }

    const [updatedTicket] = await ticketService.updateTickets([
      { id: ticket.id, ...updates },
    ])

    await ticketService.createTicketHistories([
      {
        ticket_id: ticket.id,
        actor_id,
        action: "status_changed",
        old_value: oldStatus,
        new_value: status,
      },
    ])

    return new StepResponse(updatedTicket, {
      ticket_id: ticket.id,
      old_status: oldStatus,
    })
  },
  async (rollbackData, { container }) => {
    if (!rollbackData) return
    const ticketService = container.resolve(Modules.TICKET) as any
    await ticketService.updateTickets([
      { id: rollbackData.ticket_id, status: rollbackData.old_status },
    ])
  }
)
