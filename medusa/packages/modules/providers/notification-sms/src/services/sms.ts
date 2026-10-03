import {
  Logger,
  NotificationTypes,
} from "@medusajs/framework/types"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { SmsNotificationServiceOptions } from "../types"
import { normalizePhoneNumber } from "../utils/phone-normalizer"
import { renderNotificationTemplate } from "../utils/template-renderer"

type InjectedDependencies = {
  logger: Logger
}

export class SmsNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-sms"
  protected options_: SmsNotificationServiceOptions
  protected logger_: Logger

  // In-memory record of sent messages for test/fake provider inspection
  public static sentMessages: Array<{
    to: string
    message: string
    template?: string
    data?: any
    options?: any
  }> = []

  constructor(
    { logger }: InjectedDependencies,
    options: SmsNotificationServiceOptions = {}
  ) {
    super()
    this.logger_ = logger
    this.options_ = {
      provider: options.provider || process.env.SMS_PROVIDER || "fake",
      api_key: options.api_key || process.env.SMS_API_KEY || "",
      sender: options.sender || process.env.SMS_SENDER || "",
      api_url: options.api_url || process.env.SMS_API_URL || "",
      timeout: options.timeout || (process.env.SMS_TIMEOUT ? Number(process.env.SMS_TIMEOUT) : 5000),
      retry_limit: options.retry_limit || (process.env.NOTIFICATION_RETRY_LIMIT ? Number(process.env.NOTIFICATION_RETRY_LIMIT) : 3),
    }
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification information provided"
      )
    }

    if (!notification.to) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Recipient ('to') is required for SMS notification"
      )
    }

    const recipient = normalizePhoneNumber(notification.to)
    if (!recipient) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid phone number format for recipient: ${notification.to}`
      )
    }

    // Render message content from template or raw content
    let messageText = ""
    if (notification.content?.text) {
      messageText = notification.content.text
    } else if (notification.template) {
      messageText = renderNotificationTemplate(notification.template, notification.data || {})
    } else {
      messageText = JSON.stringify(notification.data || {})
    }

    // Provider routing
    const providerType = (this.options_.provider || "fake").toLowerCase()

    this.logger_?.info?.(
      `Sending SMS via provider '${providerType}' to '${recipient}'`
    )

    if (providerType === "fake" || process.env.NODE_ENV === "test") {
      return this.sendFakeSms(recipient, messageText, notification)
    }

    return this.sendExternalSms(recipient, messageText, notification)
  }

  private async sendFakeSms(
    recipient: string,
    messageText: string,
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    SmsNotificationService.sentMessages.push({
      to: recipient,
      message: messageText,
      template: notification.template,
      data: notification.data,
      options: this.options_,
    })

    const fakeMsgId = `sms_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    return {
      id: fakeMsgId,
    }
  }

  private async sendExternalSms(
    recipient: string,
    messageText: string,
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!this.options_.api_key && !this.options_.api_url) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMS provider API key or API URL is missing in configuration"
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options_.timeout)

    try {
      const url = this.options_.api_url || "https://api.kavenegar.com/v1/json/send"
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.options_.api_key || "",
        },
        body: JSON.stringify({
          receptor: recipient,
          message: messageText,
          sender: this.options_.sender,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 429
        const errorType = isRetryable
          ? MedusaError.Types.UNEXPECTED_STATE
          : MedusaError.Types.INVALID_DATA

        throw new MedusaError(
          errorType,
          `SMS Provider HTTP ${response.status}: ${response.statusText}`
        )
      }

      const resBody: any = await response.json().catch(() => ({}))
      const providerMsgId = resBody.messageid || resBody.id || `sms_${Date.now()}`

      return {
        id: providerMsgId,
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `SMS sending timed out after ${this.options_.timeout}ms`
        )
      }
      if (err instanceof MedusaError) {
        throw err
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `SMS Provider network or unexpected error: ${err.message}`
      )
    }
  }
}
