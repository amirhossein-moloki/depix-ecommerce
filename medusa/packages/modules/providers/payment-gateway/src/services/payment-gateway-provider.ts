import { GatewayRegistry } from "../core/contracts"
import { PaymentEnvironment } from "../types"

export interface PaymentGatewayProviderOptions {
  gatewayId?: string
  environment?: PaymentEnvironment
  callbackUrl?: string
  [key: string]: unknown
}

export class PaymentGatewayProviderService {
  static identifier = "payment-gateway"

  protected readonly options_: PaymentGatewayProviderOptions
  protected readonly gatewayId_: string

  constructor(cradle: Record<string, unknown>, options: PaymentGatewayProviderOptions) {
    this.options_ = options || {}
    this.gatewayId_ = options?.gatewayId || "default_gateway"
  }

  get options(): PaymentGatewayProviderOptions {
    return this.options_
  }

  get gatewayId(): string {
    return this.gatewayId_
  }

  async initiatePayment(input: any): Promise<any> {
    const registry = GatewayRegistry.getInstance()
    try {
      const adapter = registry.getActiveGateway(this.gatewayId_, "CREATE_PAYMENT")
      const result = await adapter.createPayment({
        gateway: this.gatewayId_,
        amount: input.amount,
        currency: input.currency_code,
        description: input.data?.description,
        callbackUrl: this.options_.callbackUrl,
        idempotencyKey: input.context?.idempotency_key,
        metadata: input.data?.metadata,
      })

      return {
        id: result.payment.id || input.data?.session_id || `pay_${Date.now()}`,
        status: "pending",
        data: {
          redirectUrl: result.redirectUrl,
          actionUrl: result.actionUrl,
          action: result.action,
          reference: result.reference,
          gatewayTransactionId: result.gatewayTransactionId,
          session_id: input.data?.session_id,
        },
      }
    } catch (error: any) {
      return {
        id: input.data?.session_id || `pay_err_${Date.now()}`,
        status: "error",
        data: {
          error: error.message || "Failed to initiate payment via gateway",
        },
      }
    }
  }

  async authorizePayment(input: any): Promise<any> {
    const registry = GatewayRegistry.getInstance()
    try {
      const adapter = registry.getActiveGateway(this.gatewayId_, "VERIFY")
      const sessionData = input.data || {}
      const verifyResult = await adapter.verifyPayment({
        paymentId: sessionData.id,
        gatewayTransactionId: sessionData.gatewayTransactionId,
        reference: sessionData.reference,
        callbackData: sessionData.callbackData,
      })

      if (verifyResult.status === "SUCCESS") {
        return {
          status: "authorized",
          data: {
            ...sessionData,
            status: "SUCCESS",
            gatewayTransactionId: verifyResult.gatewayTransactionId,
            reference: verifyResult.reference,
          },
        }
      }

      return {
        status: "error",
        data: {
          ...sessionData,
          status: verifyResult.status,
          error: "Verification failed",
        },
      }
    } catch (error: any) {
      return {
        status: "error",
        data: {
          ...(input.data || {}),
          error: error.message || "Authorize verification error",
        },
      }
    }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const status = input?.data?.status || "PENDING"
    if (status === "SUCCESS") {
      return { status: "authorized" }
    }
    if (status === "FAILED" || status === "ERROR") {
      return { status: "error" }
    }
    return { status: "pending" }
  }

  async capturePayment(input: any): Promise<any> {
    return {
      data: {
        ...(input.data || {}),
        captured: true,
        captured_at: new Date().toISOString(),
      },
    }
  }

  async cancelPayment(input: any): Promise<any> {
    return {
      data: {
        ...(input.data || {}),
        cancelled: true,
      },
    }
  }

  async deletePayment(input: any): Promise<any> {
    return this.cancelPayment(input)
  }

  async refundPayment(input: any): Promise<any> {
    const registry = GatewayRegistry.getInstance()
    try {
      const adapter = registry.getActiveGateway(this.gatewayId_, "REFUND")
      if (adapter.refundPayment) {
        const result = await adapter.refundPayment({
          paymentId: input.data?.id || "",
          amount: input.amount,
        })
        return {
          data: {
            ...(input.data || {}),
            refundTransactionId: result.refundTransactionId,
            refundStatus: result.status,
          },
        }
      }
    } catch (e: any) {
      throw new Error(`Refund failed on gateway provider '${this.gatewayId_}': ${e.message}`)
    }
    return { data: input.data || {} }
  }

  async retrievePayment(input: any): Promise<any> {
    return { data: input.data || {} }
  }

  async updatePayment(input: any): Promise<any> {
    return {
      status: "pending",
      data: {
        ...(input.data || {}),
        amount: input.amount,
        currency_code: input.currency_code,
      },
    }
  }

  async getWebhookActionAndData(webhookData: any): Promise<any> {
    const registry = GatewayRegistry.getInstance()
    try {
      const adapter = registry.getActiveGateway(this.gatewayId_, "CALLBACK")
      const parsed = await adapter.handleCallback({
        body: webhookData.rawData,
        headers: webhookData.headers,
      })

      if (parsed.isSuccess) {
        return {
          action: "successful",
          data: {
            session_id: parsed.rawData?.session_id || "",
            amount: parsed.rawData?.amount || 0,
          },
        }
      }
    } catch {
      return { action: "not_supported" }
    }
    return { action: "not_supported" }
  }
}

export default PaymentGatewayProviderService
