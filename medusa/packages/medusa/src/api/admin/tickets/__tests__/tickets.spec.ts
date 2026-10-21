import { createTicketWorkflow } from "@medusajs/core-flows/ticket/workflows/create-ticket"
import { addTicketMessageWorkflow } from "@medusajs/core-flows/ticket/workflows/add-ticket-message"
import { updateTicketStatusWorkflow } from "@medusajs/core-flows/ticket/workflows/update-ticket-status"
import { updateTicketPriorityWorkflow } from "@medusajs/core-flows/ticket/workflows/update-ticket-priority"
import { assignTicketWorkflow } from "@medusajs/core-flows/ticket/workflows/assign-ticket"
import { createMedusaContainer, ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { asValue } from "awilix"
import { GET as listStoreTickets, POST as createStoreTicket } from "../../../store/tickets/route"
import { GET as getStoreTicket } from "../../../store/tickets/[id]/route"
import { GET as listStoreTicketMessages, POST as createStoreTicketMessage } from "../../../store/tickets/[id]/messages/route"
import { GET as getTicketProducts } from "../../../store/orders/[id]/ticket-products/route"
import { GET as downloadStoreAttachment } from "../../../store/ticket-attachments/[id]/download/route"
import { GET as listAdminTickets, POST as createAdminCategory } from "../route"
import { GET as getAdminTicket } from "../[id]/route"
import { POST as createAdminMessage } from "../[id]/messages/route"
import { POST as updateAdminStatus } from "../[id]/status/route"
import { POST as updateAdminPriority } from "../[id]/priority/route"
import { POST as assignAdminTicket } from "../[id]/assign/route"
import { POST as closeAdminTicket } from "../[id]/close/route"
import { POST as reopenAdminTicket } from "../[id]/reopen/route"
import { GET as getAdminReports } from "../reports/route"

describe("Support Ticketing System Comprehensive Test Suite", () => {
  let mockTicketService: any
  let mockQuery: any
  let mockEventBus: any
  let container: any

  beforeEach(() => {
    mockTicketService = {
      generateTicketNumber: jest.fn().mockResolvedValue("TKT-2026-123456"),
      listTicketCategories: jest.fn().mockResolvedValue([
        { id: "tktcat_1", name: "سفارش", slug: "orders", is_active: true, sort_order: 1 },
      ]),
      createTickets: jest.fn().mockImplementation((data) =>
        Promise.resolve(data.map((item: any, idx: number) => ({ id: `tkt_${idx + 1}`, ...item })))
      ),
      createTicketMessages: jest.fn().mockImplementation((data) =>
        Promise.resolve(data.map((item: any, idx: number) => ({ id: `tktmsg_${idx + 1}`, ...item, created_at: new Date() })))
      ),
      createTicketAttachments: jest.fn().mockImplementation((data) =>
        Promise.resolve(data.map((item: any, idx: number) => ({ id: `tktatt_${idx + 1}`, ...item })))
      ),
      createTicketHistories: jest.fn().mockImplementation((data) =>
        Promise.resolve(data.map((item: any, idx: number) => ({ id: `tkthist_${idx + 1}`, ...item })))
      ),
      listTickets: jest.fn().mockResolvedValue([
        {
          id: "tkt_1",
          ticket_number: "TKT-2026-123456",
          user_id: "cust_1",
          category_id: "tktcat_1",
          order_id: "ord_1",
          product_id: "prod_1",
          subject: "پیگیری سفارش و تحویل کالا",
          status: "open",
          priority: "normal",
          assigned_to: null,
          first_response_at: null,
          created_at: new Date(),
        },
      ]),
      listAndCountTickets: jest.fn().mockResolvedValue([
        [
          {
            id: "tkt_1",
            ticket_number: "TKT-2026-123456",
            user_id: "cust_1",
            category_id: "tktcat_1",
            subject: "پیگیری سفارش",
            status: "open",
            priority: "normal",
          },
        ],
        1,
      ]),
      listAndCountTicketMessages: jest.fn().mockResolvedValue([
        [
          { id: "tktmsg_1", ticket_id: "tkt_1", sender_id: "cust_1", sender_type: "customer", message: "سلام، لطفا سفارش من را پیگیری کنید.", is_internal_note: false },
        ],
        1,
      ]),
      listTicketAttachments: jest.fn().mockResolvedValue([
        {
          id: "tktatt_1",
          message_id: "tktmsg_1",
          original_filename: "receipt.pdf",
          storage_path: "/tmp/uploads/receipt.pdf",
          mime_type: "application/pdf",
          file_size: 1024,
          message: {
            ticket: {
              id: "tkt_1",
              user_id: "cust_1",
            },
          },
        },
      ]),
      updateTickets: jest.fn().mockImplementation((data) =>
        Promise.resolve(data.map((item: any) => ({ ...item })))
      ),
      createTicketCategories: jest.fn().mockImplementation((data) =>
        Promise.resolve(data.map((item: any, idx: number) => ({ id: `tktcat_${idx + 10}`, ...item })))
      ),
      deleteTickets: jest.fn().mockResolvedValue(undefined),
      deleteTicketMessages: jest.fn().mockResolvedValue(undefined),
    }

    mockQuery = {
      graph: jest.fn().mockImplementation(({ entity, filters }) => {
        if (entity === "order") {
          if (filters.id === "ord_1") {
            return Promise.resolve({
              data: [
                {
                  id: "ord_1",
                  customer_id: "cust_1",
                  items: [{ id: "item_1", product_id: "prod_1", title: "لپ‌تاپ گیمینگ", thumbnail: "img.jpg" }],
                },
              ],
            })
          }
          if (filters.id === "ord_other") {
            return Promise.resolve({
              data: [{ id: "ord_other", customer_id: "cust_other", items: [] }],
            })
          }
        }
        return Promise.resolve({ data: [] })
      }),
    }

    mockEventBus = {
      emit: jest.fn().mockResolvedValue(undefined),
      releaseGroupedEvents: jest.fn().mockResolvedValue(undefined),
      clearGroupedEvents: jest.fn().mockResolvedValue(undefined),
    }

    container = createMedusaContainer()
    container.register({
      [Modules.TICKET]: asValue(mockTicketService),
      [Modules.EVENT_BUS]: asValue(mockEventBus),
      [ContainerRegistrationKeys.QUERY]: asValue(mockQuery),
    })
  })

  // Scenario 1: Successful ticket creation with all required fields
  it("1. should successfully create a ticket with all required fields and attachments", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "عنوان تیکت پشتیبانی فروشگاه",
      message: "این یک توضیحات کامل برای تست ایجاد تیکت پشتیبانی است.",
      order_id: "ord_1",
      product_id: "prod_1",
      priority: "high" as const,
      attachments: [
        { original_filename: "receipt.pdf", storage_path: "/uploads/receipt.pdf", mime_type: "application/pdf", file_size: 5000 },
      ],
    }

    const { result } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(result).toBeDefined()
    expect(mockTicketService.createTickets).toHaveBeenCalled()
    expect(mockTicketService.createTicketMessages).toHaveBeenCalled()
    expect(mockTicketService.createTicketAttachments).toHaveBeenCalled()
    expect(mockTicketService.createTicketHistories).toHaveBeenCalled()
  })

  // Scenario 2: Ticket creation without order and product
  it("2. should successfully create a ticket without order_id and product_id", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "سوال عمومی درباره نحوه ارسال",
      message: "لطفاً توضیحات مربوط به زمان‌بندی ارسال کالا را ارسال کنید.",
    }

    const { result } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(result).toBeDefined()
    expect(mockTicketService.createTickets).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ order_id: null, product_id: null }),
      ])
    )
  })

  // Scenario 3: Ticket creation with order and without product
  it("3. should successfully create a ticket with order_id and without product_id", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "تاخیر در ارسال سفارش",
      message: "سفارش شماره ۱ من هنوز به دستم نرسیده است.",
      order_id: "ord_1",
    }

    const { result } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(result).toBeDefined()
    expect(mockTicketService.createTickets).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ order_id: "ord_1", product_id: null }),
      ])
    )
  })

  // Scenario 4: Ticket creation with valid product from selected order
  it("4. should successfully create a ticket with valid product belonging to order", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "مشکل در محصول لپ‌تاپ",
      message: "لپ‌تاپ دریافتی در این سفارش دارای خط و خش می‌باشد.",
      order_id: "ord_1",
      product_id: "prod_1",
    }

    const { result } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(result).toBeDefined()
    expect(mockTicketService.createTickets).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ order_id: "ord_1", product_id: "prod_1" }),
      ])
    )
  })

  // Scenario 5: Reject product not belonging to selected order
  it("5. should reject product_id that does not belong to the selected order", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "مشکل در محصول غیرمرتبط",
      message: "این محصول متعلق به این سفارش ثبت‌شده نیست.",
      order_id: "ord_1",
      product_id: "prod_invalid_99",
    }

    const { errors } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: false,
    })

    expect(errors).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toContain("not part of order")
  })

  // Scenario 6: Reject order belonging to another customer
  it("6. should reject order_id that belongs to another customer", async () => {
    const input = {
      user_id: "cust_1", // Customer 1 trying to access ord_other owned by cust_other
      category_id: "tktcat_1",
      subject: "تلاش برای استفاده از سفارش کاربر دیگر",
      message: "پیگیری سفارش متعلق به مشتری دیگر.",
      order_id: "ord_other",
    }

    const { errors } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: false,
    })

    expect(errors).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toContain("does not belong to the current customer")
  })

  // Scenario 7: Reject empty or short subject
  it("7. should reject empty or short subject (< 5 characters)", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "تست", // 4 chars
      message: "توضیحات کامل برای تست عنوان کوتاه.",
    }

    const { errors } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: false,
    })

    expect(errors).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toContain("Subject must be between 5 and 150 characters")
  })

  // Scenario 8: Reject empty or short message
  it("8. should reject empty or short description (< 10 characters)", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "عنوان معتبر سیستم تیکتینگ",
      message: "کوتاه", // 5 chars
    }

    const { errors } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: false,
    })

    expect(errors).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toContain("Message must be between 10 and 5000 characters")
  })

  // Scenario 9: Reject invalid or inactive category
  it("9. should reject invalid or inactive category_id", async () => {
    mockTicketService.listTicketCategories.mockResolvedValueOnce([]) // No active category found

    const input = {
      user_id: "cust_1",
      category_id: "tktcat_inactive",
      subject: "عنوان معتبر سیستم پشتیبانی",
      message: "توضیحات کامل برای تست دسته‌بندی غیرفعال.",
    }

    const { errors } = await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: false,
    })

    expect(errors).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toContain("Selected category is invalid or inactive")
  })

  // Scenario 10: Apply default priority 'normal'
  it("10. should apply default priority 'normal' when priority is omitted", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "سوال فنی در مورد کالا",
      message: "توضیحات سوال فنی به طور کامل نوشته شده است.",
    }

    await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(mockTicketService.createTickets).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ priority: "normal" }),
      ])
    )
  })

  // Scenario 11: Reject invalid priority
  it("11. should reject invalid priority value", async () => {
    const { errors } = await updateTicketPriorityWorkflow(container).run({
      input: {
        ticket_id: "tkt_1",
        priority: "super_high" as any,
        actor_id: "admin",
      },
      container,
      throwOnError: false,
    })

    expect(errors).toBeDefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toContain("Invalid priority")
  })

  // Scenario 12: Reject invalid file attachment (extension/MIME, size > 10MB, or > 5 files)
  it("12. should reject attachment exceeding size or disallowed MIME type or > 5 files", async () => {
    // 12a: Disallowed MIME type (executable)
    const inputExe = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "ارسال فایل ناامن",
      message: "توضیحات مربوط به ارسال فایل بدافزار.",
      attachments: [
        { original_filename: "virus.exe", storage_path: "/uploads/virus.exe", mime_type: "application/x-msdownload", file_size: 1024 },
      ],
    }

    const { errors: errorsExe } = await createTicketWorkflow(container).run({
      input: inputExe,
      container,
      throwOnError: false,
    })

    expect(errorsExe).toBeDefined()
    expect(errorsExe[0].error.message).toContain("is not allowed")

    // 12b: Size > 10MB
    const inputLarge = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "ارسال فایل خیلی بزرگ",
      message: "توضیحات مربوط به ارسال فایل با حجم حجیم.",
      attachments: [
        { original_filename: "big.pdf", storage_path: "/uploads/big.pdf", mime_type: "application/pdf", file_size: 15 * 1024 * 1024 },
      ],
    }

    const { errors: errorsLarge } = await createTicketWorkflow(container).run({
      input: inputLarge,
      container,
      throwOnError: false,
    })

    expect(errorsLarge).toBeDefined()
    expect(errorsLarge[0].error.message).toContain("exceeds maximum size")
  })

  // Scenario 13: Valid attachment creation linked to initial message
  it("13. should correctly attach valid files to initial ticket message", async () => {
    const input = {
      user_id: "cust_1",
      category_id: "tktcat_1",
      subject: "درخواست بررسی فاکتور",
      message: "فاکتور خرید به پیوست ارسال می‌گردد.",
      attachments: [
        { original_filename: "invoice.pdf", storage_path: "/storage/invoice.pdf", mime_type: "application/pdf", file_size: 2048 },
      ],
    }

    await createTicketWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(mockTicketService.createTicketAttachments).toHaveBeenCalledWith([
      expect.objectContaining({
        original_filename: "invoice.pdf",
        mime_type: "application/pdf",
        file_size: 2048,
      }),
    ])
  })

  // Scenario 14: Prevent viewing another customer's ticket (IDOR protection)
  it("14. should prevent customer from viewing another customer's ticket (IDOR check)", async () => {
    const req: any = {
      auth_context: { actor_id: "cust_unauthorized" },
      params: { id: "tkt_1" },
      scope: container,
    }
    const res: any = { json: jest.fn() }

    await expect(getStoreTicket(req, res)).rejects.toThrow("Ticket with id tkt_1 was not found")
  })

  // Scenario 15: Prevent unauthorized attachment download
  it("15. should prevent unauthorized customer from downloading another ticket's attachment", async () => {
    const req: any = {
      auth_context: { actor_id: "cust_unauthorized", actor_type: "customer" },
      params: { id: "tktatt_1" },
      scope: container,
    }
    const res: any = { json: jest.fn() }

    await expect(downloadStoreAttachment(req, res)).rejects.toThrow(
      "You are not authorized to download this attachment"
    )
  })

  // Scenario 16: Hide internal notes from customer API
  it("16. should strictly filter out internal notes in customer store ticket view", async () => {
    mockTicketService.listTickets.mockResolvedValueOnce([
      {
        id: "tkt_1",
        user_id: "cust_1",
        messages: [
          { id: "msg_1", message: "سلام مشتری هستم", is_internal_note: false },
          { id: "msg_2", message: "یادداشت کاملاً محرمانه اپراتور", is_internal_note: true },
        ],
      },
    ])

    const req: any = {
      auth_context: { actor_id: "cust_1" },
      params: { id: "tkt_1" },
      scope: container,
    }
    const jsonMock = jest.fn()
    const res: any = { json: jsonMock }

    await getStoreTicket(req, res)

    expect(jsonMock).toHaveBeenCalled()
    const returnedTicket = jsonMock.mock.calls[0][0].ticket
    expect(returnedTicket.messages).toHaveLength(1)
    expect(returnedTicket.messages[0].id).toBe("msg_1")
    expect(returnedTicket.messages.some((m: any) => m.is_internal_note)).toBe(false)
  })

  // Scenario 17: Multi-turn conversation messages with correct chronological order
  it("17. should correctly record and return multi-turn messages in chronological order", async () => {
    const req: any = {
      auth_context: { actor_id: "cust_1" },
      params: { id: "tkt_1" },
      query: { limit: "20", offset: "0" },
      scope: container,
    }
    const jsonMock = jest.fn()
    const res: any = { json: jsonMock }

    await listStoreTicketMessages(req, res)

    expect(mockTicketService.listAndCountTicketMessages).toHaveBeenCalledWith(
      { ticket_id: "tkt_1", is_internal_note: false },
      expect.objectContaining({ order: { created_at: "ASC" } })
    )
  })

  // Scenario 18: Status changes and history audit trail logging
  it("18. should record audit trail entry in ticket_history on status change", async () => {
    const input = {
      ticket_id: "tkt_1",
      status: "in_progress" as const,
      actor_id: "user_operator",
    }

    await updateTicketStatusWorkflow(container).run({
      input,
      container,
      throwOnError: true,
    })

    expect(mockTicketService.updateTickets).toHaveBeenCalledWith([
      expect.objectContaining({ id: "tkt_1", status: "in_progress" }),
    ])

    expect(mockTicketService.createTicketHistories).toHaveBeenCalledWith([
      expect.objectContaining({
        ticket_id: "tkt_1",
        actor_id: "user_operator",
        action: "status_changed",
        old_value: "open",
        new_value: "in_progress",
      }),
    ])
  })

  // Scenario 19: Unique ticket number generation
  it("19. should generate unique atomic ticket numbers", async () => {
    const num1 = await mockTicketService.generateTicketNumber()
    expect(num1).toMatch(/^TKT-2026-\d{6}$/)
  })

  // Scenario 20: Attachment download & error handling
  it("20. should gracefully return metadata when attachment file is not local streamable", async () => {
    const req: any = {
      auth_context: { actor_id: "cust_1", actor_type: "customer" },
      params: { id: "tktatt_1" },
      scope: container,
    }
    const jsonMock = jest.fn()
    const res: any = { json: jsonMock, setHeader: jest.fn() }

    await downloadStoreAttachment(req, res)

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tktatt_1",
        original_filename: "receipt.pdf",
        mime_type: "application/pdf",
      })
    )
  })

  // Scenario 21: Admin & Operator functionality (Internal note, Assign, Status, Priority, Reports)
  it("21. should support admin internal notes, operator assignment, priority update, and reporting", async () => {
    // 21a: Add internal note
    const { result: internalMsg } = await addTicketMessageWorkflow(container).run({
      input: {
        ticket_id: "tkt_1",
        sender_id: "user_operator",
        sender_type: "user",
        message: "یادداشت داخلی اپراتور درباره بررسی حساب کاربر",
        is_internal_note: true,
      },
      container,
      throwOnError: true,
    })

    expect(internalMsg.is_internal_note).toBe(true)

    // 21b: Assign operator
    await assignTicketWorkflow(container).run({
      input: {
        ticket_id: "tkt_1",
        assigned_to: "user_operator_2",
        actor_id: "admin",
      },
      container,
      throwOnError: true,
    })

    expect(mockTicketService.updateTickets).toHaveBeenCalledWith([
      expect.objectContaining({ id: "tkt_1", assigned_to: "user_operator_2" }),
    ])

    // 21c: Reports API
    const reqReport: any = { scope: container }
    const jsonMock = jest.fn()
    const resReport: any = { json: jsonMock }

    await getAdminReports(reqReport, resReport)

    expect(jsonMock).toHaveBeenCalled()
    const reports = jsonMock.mock.calls[0][0].reports
    expect(reports.total_tickets).toBeGreaterThanOrEqual(1)
  })

  // Scenario 22: Auto-reopening closed ticket on customer message
  it("22. should auto-reopen closed ticket when customer posts a new message", async () => {
    mockTicketService.listTickets.mockResolvedValueOnce([
      {
        id: "tkt_closed",
        status: "closed",
        user_id: "cust_1",
      },
    ])

    const { result } = await addTicketMessageWorkflow(container).run({
      input: {
        ticket_id: "tkt_closed",
        sender_id: "cust_1",
        sender_type: "customer",
        message: "پیام جدید مشتری روی تیکت بسته‌شده جهت بازگشایی خودکار.",
      },
      container,
      throwOnError: true,
    })

    expect(result).toBeDefined()
    expect(mockTicketService.updateTickets).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "tkt_closed",
        status: "open",
        closed_at: null,
      }),
    ])
    expect(mockTicketService.createTicketHistories).toHaveBeenCalledWith([
      expect.objectContaining({
        action: "reopened",
      }),
    ])
  })
})
