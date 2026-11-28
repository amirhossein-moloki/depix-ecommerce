import * as crypto from "crypto"
import * as fs from "fs"
import * as path from "path"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

export type NormalizedTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_for_customer"
  | "answered"
  | "resolved"
  | "closed"

export type NormalizedTicketPriority = "low" | "normal" | "high"

const STATUS_ALIASES: Record<string, NormalizedTicketStatus> = {
  open: "open",
  in_progress: "in_progress",
  waiting_for_customer: "waiting_for_customer",
  waiting_on_customer: "waiting_for_customer",
  answered: "answered",
  resolved: "resolved",
  closed: "closed",
}

const PRIORITY_ALIASES: Record<string, NormalizedTicketPriority> = {
  low: "low",
  normal: "normal",
  medium: "normal",
  high: "high",
  urgent: "high",
}

export function normalizeTicketStatus(rawStatus: string): NormalizedTicketStatus {
  const key = String(rawStatus || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")

  const normalized = STATUS_ALIASES[key]
  if (!normalized) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid ticket status '${rawStatus}'.`
    )
  }
  return normalized
}

export function normalizeTicketPriority(rawPriority: string): NormalizedTicketPriority {
  const key = String(rawPriority || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")

  const normalized = PRIORITY_ALIASES[key]
  if (!normalized) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid ticket priority '${rawPriority}'.`
    )
  }
  return normalized
}

export function formatTicketMessage<T extends Record<string, any>>(msg: T): T {
  if (!msg || typeof msg !== "object") {
    return msg
  }
  const normalizedSenderType =
    msg.sender_type === "user" ? "admin" : msg.sender_type
  const senderName =
    msg.sender_name ?? msg.metadata?.sender_name ?? null
  const isInternal = Boolean(msg.is_internal_note ?? msg.is_internal ?? false)

  return {
    ...msg,
    sender_type: normalizedSenderType,
    sender_name: senderName,
    is_internal: isInternal,
    is_internal_note: isInternal,
  }
}

export function getTicketAttachmentsDir(): string {
  const dir = path.resolve(
    process.env.TICKET_ATTACHMENTS_DIR ||
      path.join(process.cwd(), "uploads", "ticket-attachments")
  )
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export interface StagedAttachmentMeta {
  attachment_id: string
  original_filename: string
  storage_path: string
  mime_type: string
  file_size: number
}

export function stageTicketAttachment(file: {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}): StagedAttachmentMeta {
  const attachmentId = `tktatt_${crypto.randomBytes(10).toString("hex")}`
  const dir = getTicketAttachmentsDir()
  const safeName = path.basename(file.originalname || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = path.join(dir, `${attachmentId}_${safeName}`)
  const metaPath = path.join(dir, `${attachmentId}.meta.json`)

  fs.writeFileSync(storagePath, file.buffer)

  const meta: StagedAttachmentMeta = {
    attachment_id: attachmentId,
    original_filename: file.originalname || safeName,
    storage_path: storagePath,
    mime_type: file.mimetype || "application/octet-stream",
    file_size: Number(file.size ?? file.buffer.length),
  }

  fs.writeFileSync(metaPath, JSON.stringify(meta))
  return meta
}

export function resolveStagedAttachments(
  attachmentIds: string[]
): Array<{
  original_filename: string
  storage_path: string
  mime_type: string
  file_size: number
}> {
  const dir = getTicketAttachmentsDir()
  const resolved: Array<{
    original_filename: string
    storage_path: string
    mime_type: string
    file_size: number
  }> = []

  for (const id of attachmentIds) {
    if (!id || typeof id !== "string") continue
    const safeId = path.basename(id)
    const metaPath = path.join(dir, `${safeId}.meta.json`)
    if (!fs.existsSync(metaPath)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Staged attachment '${id}' not found`
      )
    }
    const meta = JSON.parse(
      fs.readFileSync(metaPath, "utf-8")
    ) as StagedAttachmentMeta
    resolved.push({
      original_filename: meta.original_filename,
      storage_path: meta.storage_path,
      mime_type: meta.mime_type,
      file_size: meta.file_size,
    })
  }

  return resolved
}

function safeResolve<T = any>(scope: any, key: string): T | null {
  try {
    return scope?.resolve?.(key) ?? null
  } catch {
    return null
  }
}

function extractCustomerRows(res: any): any[] {
  if (Array.isArray(res)) {
    return res
  }
  if (Array.isArray(res?.rows)) {
    return res.rows
  }
  return []
}

function extractCustomerName(customer: any): string | null {
  if (!customer || typeof customer !== "object") {
    return null
  }
  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  if (fullName) {
    return fullName
  }
  const metaFullName =
    typeof customer.metadata?.full_name === "string"
      ? customer.metadata.full_name.trim()
      : ""
  if (metaFullName) {
    return metaFullName
  }
  const metaName =
    typeof customer.metadata?.name === "string"
      ? customer.metadata.name.trim()
      : ""
  if (metaName) {
    return metaName
  }
  const companyName =
    typeof customer.company_name === "string" ? customer.company_name.trim() : ""
  if (companyName) {
    return companyName
  }
  return null
}

function extractCustomerPhone(customer: any): string | null {
  if (!customer || typeof customer !== "object") {
    return null
  }
  const phone =
    typeof customer.phone === "string" ? customer.phone.trim() : ""
  if (phone) {
    return phone
  }
  const metaPhone =
    typeof customer.metadata?.phone === "string"
      ? customer.metadata.phone.trim()
      : ""
  if (metaPhone) {
    return metaPhone
  }
  const metaMobile =
    typeof customer.metadata?.mobile === "string"
      ? customer.metadata.mobile.trim()
      : ""
  if (metaMobile) {
    return metaMobile
  }
  return null
}

/**
 * Batch-enriches tickets with `customer_id`, `customer_name`, `customer_phone`,
 * and `assigned_to_id` without N+1 queries.
 */
export async function enrichTicketsWithCustomer<T extends Record<string, any>>(
  scope: any,
  tickets: T[]
): Promise<T[]> {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return []
  }

  const customerIds = Array.from(
    new Set(
      tickets
        .map((ticket) => {
          const cid = ticket?.customer_id ?? ticket?.user_id
          return typeof cid === "string" ? cid.trim() : ""
        })
        .filter(Boolean)
    )
  )

  const customerMap = new Map<string, any>()
  const customerService = safeResolve<any>(scope, Modules.CUSTOMER)

  if (customerIds.length > 0 && customerService) {
    if (typeof customerService.listCustomers === "function") {
      try {
        const customers = extractCustomerRows(
          await customerService.listCustomers(
            { id: customerIds },
            { take: customerIds.length }
          )
        )
        for (const customer of customers) {
          if (customer?.id) {
            customerMap.set(customer.id, customer)
          }
        }
      } catch {
        // Ignore and try query fallback below
      }
    } else if (typeof customerService.retrieveCustomer === "function") {
      const retrieved = await Promise.all(
        customerIds.map((id) =>
          customerService.retrieveCustomer(id).catch(() => null)
        )
      )
      for (const customer of retrieved) {
        if (customer?.id) {
          customerMap.set(customer.id, customer)
        }
      }
    }
  }

  const missingIds = customerIds.filter((id) => !customerMap.has(id))
  if (missingIds.length > 0) {
    const query = safeResolve<any>(scope, ContainerRegistrationKeys.QUERY)
    if (typeof query?.graph === "function") {
      try {
        const result = await query.graph({
          entity: "customer",
          fields: [
            "id",
            "first_name",
            "last_name",
            "phone",
            "email",
            "company_name",
            "metadata",
          ],
          filters: { id: missingIds },
        })
        const customers = Array.isArray(result?.data) ? result.data : []
        for (const customer of customers) {
          if (customer?.id) {
            customerMap.set(customer.id, customer)
          }
        }
      } catch {
        // Ignore customer lookup errors when query graph cannot resolve customer
      }
    }
  }

  return tickets.map((ticket) => {
    const rawCustomerId = ticket?.customer_id ?? ticket?.user_id ?? null
    const resolvedCustomerId =
      typeof rawCustomerId === "string"
        ? rawCustomerId.trim() || null
        : rawCustomerId
    const customer = resolvedCustomerId
      ? customerMap.get(resolvedCustomerId)
      : undefined
    const metaName =
      typeof ticket?.metadata?.customer_name === "string"
        ? ticket.metadata.customer_name.trim() || null
        : null
    const metaPhone =
      typeof ticket?.metadata?.customer_phone === "string"
        ? ticket.metadata.customer_phone.trim() || null
        : null

    return {
      ...ticket,
      customer_id: resolvedCustomerId,
      customer_name:
        ticket?.customer_name ?? extractCustomerName(customer) ?? metaName,
      customer_phone:
        ticket?.customer_phone ?? extractCustomerPhone(customer) ?? metaPhone,
      assigned_to_id: ticket?.assigned_to_id ?? ticket?.assigned_to ?? null,
    }
  })
}

export async function enrichTicketWithCustomer<T extends Record<string, any>>(
  scope: any,
  ticket: T
): Promise<T> {
  if (!ticket || typeof ticket !== "object") {
    return ticket
  }
  const [enriched] = await enrichTicketsWithCustomer(scope, [ticket])
  return enriched
}
