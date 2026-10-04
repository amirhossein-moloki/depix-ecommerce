export interface SmsNotificationServiceOptions {
  provider?: string // 'fake' | 'kavenegar' | 'ghasedak' | etc.
  api_key?: string
  sender?: string
  api_url?: string
  timeout?: number
  retry_limit?: number
}

export interface SmsSendResult {
  id?: string
  status?: "accepted" | "sent" | "failed"
  provider_message_id?: string
  error_code?: string
  error_message?: string
  raw_response?: any
}
