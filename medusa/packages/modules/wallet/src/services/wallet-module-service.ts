export interface Wallet {
  id: string
  ownerId: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface Money {
  amountMinor: bigint
  currency: string
}

export interface LedgerTransaction {
  id: string
  reference: string
  idempotencyKey: string
  status: "posted" | "pending"
  createdAt: Date
}

export interface WalletServiceContract {
  getCustomerWallet(
    customerId: string,
    currency?: string
  ): Promise<{ wallet: Wallet; balance: Money }>
  getWalletBalance(walletId: string): Promise<Money>
  topUpWallet(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    reference: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction>
  adminCreditWallet(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    reason: string
    adminId: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction>
  adminDebitWallet(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    reason: string
    adminId: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction>
  debitForCheckout(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    orderId: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction>
}

export class MedusaWalletModuleService {
  protected walletService_: WalletServiceContract

  constructor(options: { walletService?: WalletServiceContract } = {}) {
    if (options.walletService) {
      this.walletService_ = options.walletService
    } else {
      // In production runtime, walletService is injected via DI container from @amirhossein-moloki/wallet-core
      try {
        const walletCore = require("@amirhossein-moloki/wallet-core")
        this.walletService_ = new walletCore.WalletService()
      } catch {
        this.walletService_ = null as any
      }
    }
  }

  public async getCustomerWallet(
    customerId: string,
    currency: string = "IRR"
  ): Promise<{ wallet: Wallet; balance: Money }> {
    if (!this.walletService_) {
      throw new Error(
        "WalletService is not initialized. Please ensure @amirhossein-moloki/wallet-core is installed and configured."
      )
    }
    return await this.walletService_.getCustomerWallet(customerId, currency)
  }

  public async getWalletBalance(walletId: string): Promise<Money> {
    if (!this.walletService_) {
      throw new Error("WalletService is not initialized.")
    }
    return await this.walletService_.getWalletBalance(walletId)
  }

  public async topUpWallet(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    reference: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction> {
    if (!params.idempotencyKey) {
      throw new Error("Non-empty idempotencyKey is required for topUpWallet.")
    }
    if (!this.walletService_) {
      throw new Error("WalletService is not initialized.")
    }
    return await this.walletService_.topUpWallet(params)
  }

  public async adminCreditWallet(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    reason: string
    adminId: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction> {
    if (!params.idempotencyKey) {
      throw new Error("Non-empty idempotencyKey is required for adminCreditWallet.")
    }
    if (!this.walletService_) {
      throw new Error("WalletService is not initialized.")
    }
    return await this.walletService_.adminCreditWallet(params)
  }

  public async adminDebitWallet(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    reason: string
    adminId: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction> {
    if (!params.idempotencyKey) {
      throw new Error("Non-empty idempotencyKey is required for adminDebitWallet.")
    }
    if (!this.walletService_) {
      throw new Error("WalletService is not initialized.")
    }
    return await this.walletService_.adminDebitWallet(params)
  }

  public async debitForCheckout(params: {
    walletId: string
    amountMinor: bigint | number
    currency: string
    orderId: string
    idempotencyKey: string
    metadata?: Record<string, unknown>
  }): Promise<LedgerTransaction> {
    if (!params.idempotencyKey) {
      throw new Error("Non-empty idempotencyKey is required for debitForCheckout.")
    }
    if (!this.walletService_) {
      throw new Error("WalletService is not initialized.")
    }
    return await this.walletService_.debitForCheckout(params)
  }
}

export default MedusaWalletModuleService
