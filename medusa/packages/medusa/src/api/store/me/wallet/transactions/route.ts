import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer session authentication required to access wallet transactions."
    )
  }

  const currency = (req.query.currency as string) || "IRR"

  try {
    const walletModuleService = req.scope.resolve("walletModuleService") as any
    const walletData = await walletModuleService.getCustomerWallet(customerId, currency)

    // Retrieve ledger transactions if method exists
    const transactions = walletModuleService.getWalletTransactions
      ? await walletModuleService.getWalletTransactions(walletData.wallet.id)
      : []

    return res.status(200).json({
      wallet_id: walletData.wallet.id,
      transactions,
    })
  } catch (error: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to retrieve customer wallet transactions: ${error.message}`
    )
  }
}
