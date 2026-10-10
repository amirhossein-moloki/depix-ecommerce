import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const adminId = req.auth_context?.actor_id

  if (!adminId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Admin authentication required for wallet debit operations."
    )
  }

  const {
    wallet_id,
    amount_minor,
    currency = "IRR",
    reason,
    idempotency_key,
    metadata,
  } = req.body as {
    wallet_id: string
    amount_minor: number | string
    currency?: string
    reason: string
    idempotency_key: string
    metadata?: Record<string, unknown>
  }

  if (!wallet_id || !amount_minor || !reason || !idempotency_key) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "wallet_id, amount_minor, reason, and idempotency_key are required."
    )
  }

  const amount = BigInt(amount_minor)
  if (amount <= 0n) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "amount_minor must be a positive integer."
    )
  }

  try {
    const walletModuleService = req.scope.resolve("walletModuleService") as any
    const transaction = await walletModuleService.adminDebitWallet({
      walletId: wallet_id,
      amountMinor: amount,
      currency: currency.toUpperCase(),
      reason,
      adminId,
      idempotencyKey: idempotency_key,
      metadata: {
        ...metadata,
        admin_actor_id: adminId,
      },
    })

    return res.status(200).json({
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        idempotency_key: transaction.idempotencyKey,
        status: transaction.status,
      },
    })
  } catch (error: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Admin wallet debit operation failed: ${error.message}`
    )
  }
}
