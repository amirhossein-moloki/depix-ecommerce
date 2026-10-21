import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type AttachmentInput = {
  original_filename: string
  storage_path: string
  mime_type: string
  file_size: number
}

export type CreateTicketStepInput = {
  user_id: string
  category_id: string
  subject: string
  message: string
  order_id?: string | null
  product_id?: string | null
  priority?: "low" | "normal" | "high"
  attachments?: AttachmentInput[]
}

export const createTicketStepId = "create-ticket-step"

export const createTicketStep = createStep(
  createTicketStepId,
  async (input: CreateTicketStepInput, { container }) => {
    const {
      user_id,
      category_id,
      subject,
      message,
      order_id,
      product_id,
      priority = "normal",
      attachments = [],
    } = input

    // Subject validation
    const trimmedSubject = subject ? subject.trim() : ""
    if (trimmedSubject.length < 5 || trimmedSubject.length > 150) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Subject must be between 5 and 150 characters"
      )
    }

    // Message validation
    const trimmedMessage = message ? message.trim() : ""
    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Message must be between 10 and 5000 characters"
      )
    }

    // Attachments validation: max 5 files, max 10MB each
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

    // Category validation: must exist and be active
    const [category] = await ticketService.listTicketCategories(
      { id: category_id, is_active: true },
      { take: 1 }
    )

    if (!category) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Selected category is invalid or inactive"
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Order validation if order_id is provided
    if (order_id) {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "customer_id", "items.product_id"],
        filters: { id: order_id },
      })

      const order = orders && orders[0]
      if (!order) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Order with id ${order_id} was not found`
        )
      }

      if (order.customer_id !== user_id) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "Selected order does not belong to the current customer"
        )
      }

      // Product validation if product_id is provided
      if (product_id) {
        const hasProduct = order.items?.some(
          (item: any) => item.product_id === product_id
        )
        if (!hasProduct) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Product ${product_id} is not part of order ${order_id}`
          )
        }
      }
    } else {
      // If no order_id provided, product_id must be null
      if (product_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "product_id cannot be specified without a valid order_id"
        )
      }
    }

    // Generate unique ticket number
    const ticket_number = await ticketService.generateTicketNumber()

    // Create Ticket
    const [ticket] = await ticketService.createTickets([
      {
        ticket_number,
        user_id,
        category_id,
        order_id: order_id || null,
        product_id: product_id || null,
        subject: trimmedSubject,
        status: "open",
        priority,
        last_message_at: new Date(),
      },
    ])

    // Create Initial Message
    const [msg] = await ticketService.createTicketMessages([
      {
        ticket_id: ticket.id,
        sender_id: user_id,
        sender_type: "customer",
        message: trimmedMessage,
        is_internal_note: false,
      },
    ])

    // Create Attachments if any
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

    // Create Initial History record
    await ticketService.createTicketHistories([
      {
        ticket_id: ticket.id,
        actor_id: user_id,
        action: "created",
        new_value: "open",
      },
    ])

    return new StepResponse(ticket, ticket.id)
  },
  async (ticketId, { container }) => {
    if (!ticketId) return
    const ticketService = container.resolve(Modules.TICKET) as any
    await ticketService.deleteTickets([ticketId])
  }
)
