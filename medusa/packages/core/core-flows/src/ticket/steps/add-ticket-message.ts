import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { AttachmentInput } from "./create-ticket"

export type AddTicketMessageStepInput = {
  ticket_id: string
  sender_id: string
  sender_type: "customer" | "user"
  message: string
  is_internal_note?: boolean
  attachments?: AttachmentInput[]
}

export const addTicketMessageStepId = "add-ticket-message-step"

export const addTicketMessageStep = createStep(
  addTicketMessageStepId,
  async (input: AddTicketMessageStepInput, { container }) => {
    const {
      ticket_id,
      sender_id,
      sender_type,
      message,
      is_internal_note = false,
      attachments = [],
    } = input

    // Message validation
    const trimmedMessage = message ? message.trim() : ""
    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Message must be between 10 and 5000 characters"
      )
    }

    // Attachments validation
    if (attachments.length > 5) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Maximum 5 attachments allowed per message"
      )
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]

    for (const att of attachments) {
      if (att.file_size > 10 * 1024 * 1024) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `File ${att.original_filename} exceeds maximum size of 10MB`
        )
      }
      if (!allowedMimeTypes.includes(att.mime_type)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `File ${att.original_filename} type ${att.mime_type} is not allowed`
        )
      }
    }

    const ticketService = container.resolve(Modules.TICKET) as any

    // Fetch ticket
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

    const now = new Date()
    const ticketUpdates: Record<string, any> = {
      last_message_at: now,
    }

    let historyAction = is_internal_note ? "internal_note_added" : "message_added"

    if (sender_type === "customer") {
      if (ticket.user_id !== sender_id) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "You are not authorized to send messages on this ticket"
        )
      }

      // Customer policy: if ticket is closed, auto-reopen to open
      if (ticket.status === "closed") {
        ticketUpdates.status = "open"
        ticketUpdates.closed_at = null
        historyAction = "reopened"
      } else if (
        ticket.status === "answered" ||
        ticket.status === "waiting_for_customer"
      ) {
        ticketUpdates.status = "open"
      }
    } else if (sender_type === "user") {
      if (!is_internal_note) {
        if (!ticket.first_response_at) {
          ticketUpdates.first_response_at = now
        }
        ticketUpdates.status = "answered"
      }
    }

    // Update Ticket record
    await ticketService.updateTickets([{ id: ticket.id, ...ticketUpdates }])

    // Create TicketMessage record
    const [msg] = await ticketService.createTicketMessages([
      {
        ticket_id: ticket.id,
        sender_id,
        sender_type,
        message: trimmedMessage,
        is_internal_note,
      },
    ])

    // Create attachments if any
    if (attachments.length > 0) {
      await ticketService.createTicketAttachments(
        attachments.map((att) => ({
          message_id: msg.id,
          original_filename: att.original_filename,
          storage_path: att.storage_path,
          mime_type: att.mime_type,
          file_size: att.file_size,
        }))
      )
    }

    // Create History record
    await ticketService.createTicketHistories([
      {
        ticket_id: ticket.id,
        actor_id: sender_id,
        action: historyAction,
        metadata: {
          is_internal_note,
          message_id: msg.id,
        },
      },
    ])

    return new StepResponse(msg, msg.id)
  },
  async (messageId, { container }) => {
    if (!messageId) return
    const ticketService = container.resolve(Modules.TICKET) as any
    await ticketService.deleteTicketMessages([messageId])
  }
)
