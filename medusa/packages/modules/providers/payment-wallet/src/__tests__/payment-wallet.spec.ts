import MedusaWalletPaymentProvider from "../services/payment-wallet-provider"
import { WalletServiceContract } from "@medusajs/wallet"

const fn = typeof vi !== "undefined" ? vi.fn : jest.fn

describe("MedusaWalletPaymentProvider (pp_wallet)", () => {
  let mockWalletService: any
  let provider: MedusaWalletPaymentProvider

  beforeEach(() => {
    mockWalletService = {
      getCustomerWallet: fn(),
      getWalletBalance: fn(),
      topUpWallet: fn(),
      adminCreditWallet: fn(),
      adminDebitWallet: fn(),
      debitForCheckout: fn(),
    }
    provider = new MedusaWalletPaymentProvider(mockWalletService)
  })

  test("has correct PROVIDER_ID 'pp_wallet'", () => {
    expect(MedusaWalletPaymentProvider.PROVIDER_ID).toBe("pp_wallet")
    expect(provider.identifier).toBe("pp_wallet")
  })

  describe("initiatePayment", () => {
    test("returns error if neither customer_id nor wallet_id provided", async () => {
      const result = await provider.initiatePayment({
        amount: 100000,
        currency_code: "IRR",
      })
      expect(result.status).toBe("error")
      expect(result.error).toContain("Customer identity or wallet ID is required")
    })

    test("returns pending status when customer wallet balance is sufficient", async () => {
      mockWalletService.getCustomerWallet.mockResolvedValueOnce({
        wallet: {
          id: "w_123",
          ownerId: "cust_123",
          currency: "IRR",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        balance: { amountMinor: 500000n, currency: "IRR" },
      })

      const result = await provider.initiatePayment({
        amount: 100000,
        currency_code: "IRR",
        customer_id: "cust_123",
      })

      expect(result.status).toBe("pending")
      expect(result.data.wallet_id).toBe("w_123")
      expect(result.data.amount).toBe("100000")
    })

    test("returns error when customer wallet balance is insufficient", async () => {
      mockWalletService.getCustomerWallet.mockResolvedValueOnce({
        wallet: {
          id: "w_123",
          ownerId: "cust_123",
          currency: "IRR",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        balance: { amountMinor: 50000n, currency: "IRR" },
      })

      const result = await provider.initiatePayment({
        amount: 100000,
        currency_code: "IRR",
        customer_id: "cust_123",
      })

      expect(result.status).toBe("error")
      expect(result.error).toContain("Insufficient wallet balance")
    })
  })

  describe("authorizePayment", () => {
    test("requires non-empty idempotency key", async () => {
      const result = await provider.authorizePayment(
        { wallet_id: "w_123", amount: "100000", currency: "IRR" },
        "",
        "order_123"
      )

      expect(result.status).toBe("error")
      expect(result.error).toContain("Idempotency key is required")
    })

    test("successfully authorizes payment and debits ledger", async () => {
      mockWalletService.debitForCheckout.mockResolvedValueOnce({
        id: "tx_001",
        reference: "order_123",
        idempotencyKey: "idemp_123",
        status: "posted",
        createdAt: new Date(),
      })

      const result = await provider.authorizePayment(
        { wallet_id: "w_123", amount: "100000", currency: "IRR" },
        "idemp_123",
        "order_123"
      )

      expect(result.status).toBe("authorized")
      expect(result.data.transaction_id).toBe("tx_001")
      expect(mockWalletService.debitForCheckout).toHaveBeenCalledWith({
        walletId: "w_123",
        amountMinor: 100000n,
        currency: "IRR",
        orderId: "order_123",
        idempotencyKey: "idemp_123",
        metadata: { checkout_authorization: true, order_id: "order_123" },
      })
    })
  })

  describe("refundPayment", () => {
    test("refunds payment by crediting customer wallet via adminCreditWallet", async () => {
      mockWalletService.adminCreditWallet.mockResolvedValueOnce({
        id: "tx_refund_001",
        reference: "refund",
        idempotencyKey: "idemp_refund_123",
        status: "posted",
        createdAt: new Date(),
      })

      const result = await provider.refundPayment(
        { wallet_id: "w_123", currency: "IRR", order_id: "order_123" },
        100000n,
        "Customer return",
        "idemp_refund_123"
      )

      expect(result.status).toBe("captured")
      expect(result.data.refund_transaction_id).toBe("tx_refund_001")
      expect(mockWalletService.adminCreditWallet).toHaveBeenCalledWith({
        walletId: "w_123",
        amountMinor: 100000n,
        currency: "IRR",
        reason: "Customer return",
        adminId: "system_refund",
        idempotencyKey: "idemp_refund_123",
        metadata: { order_id: "order_123", refund_reason: "Customer return" },
      })
    })
  })
})
