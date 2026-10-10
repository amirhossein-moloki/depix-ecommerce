import { Module } from "@medusajs/framework/utils"
import { MedusaWalletModuleService } from "./services/wallet-module-service"

export const WALLET_MODULE = "wallet"

export default Module(WALLET_MODULE, {
  service: MedusaWalletModuleService,
})

export * from "./services/wallet-module-service"
