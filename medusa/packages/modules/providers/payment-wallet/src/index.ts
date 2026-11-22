import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MedusaWalletPaymentProvider from "./services/payment-wallet-provider"

export * from "./services/payment-wallet-provider"
export { MedusaWalletPaymentProvider }

export default ModuleProvider(Modules.PAYMENT, {
  services: [MedusaWalletPaymentProvider],
})
