import { ModuleProviderExports } from "@medusajs/framework/types"
import { SmsNotificationService } from "./services/sms"

export * from "./services/sms"
export * from "./types"
export * from "./utils/phone-normalizer"
export * from "./utils/template-renderer"

const services = [SmsNotificationService]

export const providerExports: ModuleProviderExports = {
  services,
}

export default providerExports
