export type PaymentEnvironment = "production" | "sandbox" | "test"

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "AUTHORIZED"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "REVERSED"
  | "CALLBACK_RECEIVED"

export type CapabilityType =
  | "CREATE_PAYMENT"
  | "VERIFY"
  | "INQUIRY"
  | "REFUND"
  | "REVERSE"
  | "CALLBACK"
  | "WEBHOOK"
  | "AUTHORIZE"
  | "CAPTURE"
  | "CANCEL"

export interface PaymentGatewayConfig {
  gatewayId: string
  environment?: PaymentEnvironment
  callbackUrl?: string
  [key: string]: unknown
}

export interface PaymentEntity {
  id: string
  projectId?: string
  amount: number
  currency: string
  description?: string
  callbackUrl?: string
  gateway: string
  status: PaymentStatus
  metadata?: Record<string, unknown>
  idempotencyKey?: string
  version?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface CreatePaymentInput {
  gateway: string
  amount: number
  currency: string
  description?: string
  callbackUrl?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface CreatePaymentOutput {
  payment: PaymentEntity
  status: PaymentStatus
  redirectUrl?: string
  actionUrl?: string
  action?: Record<string, unknown>
  reference?: string
  gatewayTransactionId?: string
}

export interface VerifyPaymentInput {
  paymentId?: string
  gatewayTransactionId?: string
  reference?: string
  callbackData?: Record<string, unknown>
}

export interface VerifyPaymentOutput {
  status: PaymentStatus
  gatewayTransactionId?: string
  reference?: string
  rawData?: Record<string, unknown>
}

export interface RefundPaymentInput {
  paymentId: string
  amount: number
  reason?: string
}

export interface RefundPaymentOutput {
  status: PaymentStatus
  refundTransactionId?: string
  rawData?: Record<string, unknown>
}

export interface ReversePaymentInput {
  paymentId: string
  reason?: string
}

export interface ReversePaymentOutput {
  status: PaymentStatus
  rawData?: Record<string, unknown>
}

export interface CallbackInput {
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  headers?: Record<string, unknown>
}

export interface CallbackResult {
  isSuccess: boolean
  paymentId?: string
  gatewayTransactionId?: string
  reference?: string
  rawData?: Record<string, unknown>
  errorMessage?: string
}
