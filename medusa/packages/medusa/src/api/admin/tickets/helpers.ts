import * as crypto from "crypto"
import * as fs from "fs"
import * as path from "path"
import { MedusaError } from "@medusajs/framework/utils"

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

  return {
    ...msg,
    sender_type: normalizedSenderType,
    sender_name: senderName,
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
