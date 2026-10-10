import { WalletServiceContract } from "@medusajs/wallet"

export class MedusaWalletPaymentProvider {
  public static readonly PROVIDER_ID = "pp_wallet"
  public readonly identifier = "pp_wallet"

  protected readonly walletService_: WalletServiceContract

  constructor(walletService?: WalletServiceContract) {
    this.walletService_ = walletService as WalletServiceContract
  }

  public async initiatePayment(input: any): Promise<{
    status: "pending" | "error"
    data: Record<string, unknown>
    error?: string
  }> {
    try {
      const amount = input.amount || input.data?.amount || 0
      const amountMinor = BigInt(amount)
      const currency = ((input.currency_code || input.currency || "IRR") as string).toUpperCase()
      const customerId = input.customer_id || input.data?.customer_id

      if (!customerId && !input.wallet_id && !input.data?.wallet_id) {
        return {
          status: "error",
          data: { amount: amountMinor.toString(), currency },
          error: "Customer identity or wallet ID is required for wallet payment initiation.",
        }
      }

      if (this.walletService_) {
        let walletId = input.wallet_id || input.data?.wallet_id
        if (!walletId && customerId) {
          const customerWallet = await this.walletService_.getCustomerWallet(customerId, currency)
          walletId = customerWallet.wallet.id
          if (customerWallet.balance.amountMinor < amountMinor) {
            return {
              status: "error",
              data: {
                wallet_id: walletId,
                amount: amountMinor.toString(),
                currency,
                current_balance: customerWallet.balance.amountMinor.toString(),
              },
              error: "Insufficient wallet balance for payment session.",
            }
          }
        } else if (walletId) {
          const balance = await this.walletService_.getWalletBalance(walletId)
          if (balance.amountMinor < amountMinor) {
            return {
              status: "error",
              data: {
                wallet_id: walletId,
                amount: amountMinor.toString(),
                currency,
                current_balance: balance.amountMinor.toString(),
              },
              error: "Insufficient wallet balance for payment session.",
            }
          }
        }

        return {
          status: "pending",
          data: {
            wallet_id: walletId,
            customer_id: customerId,
            amount: amountMinor.toString(),
            currency,
            initiated_at: new Date().toISOString(),
          },
        }
      }

      return {
        status: "pending",
        data: {
          wallet_id: input.wallet_id || input.data?.wallet_id,
          customer_id: customerId,
          amount: amountMinor.toString(),
          currency,
          initiated_at: new Date().toISOString(),
        },
      }
    } catch (err: any) {
      return {
        status: "error",
        data: { error: err.message },
        error: err.message || "Failed to initiate wallet payment session.",
      }
    }
  }

  public async authorizePayment(
    paymentSessionDataOrInput: any,
    idempotencyKeyParam?: string,
    orderIdParam?: string
  ): Promise<{
    status: "authorized" | "error"
    data: Record<string, unknown>
    error?: string
  }> {
    try {
      const paymentSessionData = paymentSessionDataOrInput?.data || paymentSessionDataOrInput || {}
      const idempotencyKey =
        idempotencyKeyParam ||
        paymentSessionDataOrInput?.context?.idempotency_key ||
        paymentSessionData.idempotency_key

      const orderId =
        orderIdParam ||
        paymentSessionDataOrInput?.context?.order_id ||
        paymentSessionData.order_id ||
        `ord_${Date.now()}`

      if (!idempotencyKey) {
        return {
          status: "error",
          data: paymentSessionData,
          error: "Idempotency key is required for wallet payment authorization.",
        }
      }

      const walletId = paymentSessionData.wallet_id as string
      const amountMinor = BigInt((paymentSessionData.amount as string) || "0")
      const currency = ((paymentSessionData.currency as string) || "IRR").toUpperCase()

      if (this.walletService_ && walletId) {
        const transaction = await this.walletService_.debitForCheckout({
          walletId,
          amountMinor,
          currency,
          orderId,
          idempotencyKey,
          metadata: {
            checkout_authorization: true,
            order_id: orderId,
          },
        })

        return {
          status: "authorized",
          data: {
            ...paymentSessionData,
            transaction_id: transaction.id,
            authorized_at: new Date().toISOString(),
            idempotency_key: idempotencyKey,
            order_id: orderId,
          },
        }
      }

      return {
        status: "authorized",
        data: {
          ...paymentSessionData,
          authorized_at: new Date().toISOString(),
          idempotency_key: idempotencyKey,
          order_id: orderId,
        },
      }
    } catch (err: any) {
      return {
        status: "error",
        data: paymentSessionDataOrInput,
        error: err.message || "Wallet authorization failed.",
      }
    }
  }

  public async capturePayment(paymentData: Record<string, unknown>): Promise<{
    status: "captured"
    data: Record<string, unknown>
  }> {
    const data = (paymentData as any)?.data || paymentData
    return {
      status: "captured",
      data: {
        ...data,
        captured_at: new Date().toISOString(),
      },
    }
  }

  public async cancelPayment(paymentData: Record<string, unknown>): Promise<{
    status: "canceled"
    data: Record<string, unknown>
  }> {
    const data = (paymentData as any)?.data || paymentData
    return {
      status: "canceled",
      data: {
        ...data,
        canceled_at: new Date().toISOString(),
      },
    }
  }

  public async refundPayment(
    paymentDataOrInput: any,
    refundAmountMinorParam?: bigint | number,
    reasonParam?: string,
    idempotencyKeyParam?: string
  ): Promise<{
    status: "captured" | "error"
    data: Record<string, unknown>
    error?: string
  }> {
    try {
      const paymentData = paymentDataOrInput?.data || paymentDataOrInput || {}
      const idempotencyKey =
        idempotencyKeyParam ||
        paymentDataOrInput?.context?.idempotency_key ||
        paymentData.idempotency_key ||
        `ref_idemp_${Date.now()}`

      const refundAmountMinor =
        refundAmountMinorParam !== undefined
          ? refundAmountMinorParam
          : paymentDataOrInput?.amount || paymentData?.amount || 0

      const reason = reasonParam || paymentDataOrInput?.reason || "Order refund credit to wallet"

      if (!idempotencyKey) {
        return {
          status: "error",
          data: paymentData,
          error: "Idempotency key is required for wallet refund.",
        }
      }

      const walletId = paymentData.wallet_id as string
      const currency = ((paymentData.currency as string) || "IRR").toUpperCase()
      const amount = BigInt(refundAmountMinor)

      if (this.walletService_ && walletId) {
        const transaction = await this.walletService_.adminCreditWallet({
          walletId,
          amountMinor: amount,
          currency,
          reason,
          adminId: "system_refund",
          idempotencyKey,
          metadata: {
            order_id: paymentData.order_id,
            refund_reason: reason,
          },
        })

        return {
          status: "captured",
          data: {
            ...paymentData,
            refund_transaction_id: transaction.id,
            refunded_amount: amount.toString(),
            refunded_at: new Date().toISOString(),
          },
        }
      }

      return {
        status: "captured",
        data: {
          ...paymentData,
          refunded_amount: amount.toString(),
          refunded_at: new Date().toISOString(),
        },
      }
    } catch (err: any) {
      return {
        status: "error",
        data: paymentDataOrInput,
        error: err.message || "Wallet refund failed.",
      }
    }
  }
}

export default MedusaWalletPaymentProvider
