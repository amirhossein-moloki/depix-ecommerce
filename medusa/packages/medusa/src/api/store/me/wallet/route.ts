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
      "Customer session authentication required to access wallet balance."
    )
  }

  const currency = (req.query.currency as string) || "IRR"

  try {
    const walletModuleService = req.scope.resolve("walletModuleService") as any
    const result = await walletModuleService.getCustomerWallet(customerId, currency)

    return res.status(200).json({
      wallet: {
        id: result.wallet.id,
        owner_id: result.wallet.ownerId,
        currency: result.wallet.currency,
      },
      balance: {
        amount_minor: result.balance.amountMinor.toString(),
        currency: result.balance.currency,
      },
    })
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Wallet for customer ${customerId} not found.`
      )
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to retrieve customer wallet balance: ${error.message}`
    )
  }
}
