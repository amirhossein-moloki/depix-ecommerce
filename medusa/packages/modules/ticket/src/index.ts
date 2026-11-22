import { Module, Modules } from "@medusajs/framework/utils"
import TicketModuleService from "./services/ticket-module-service"

export default Module(Modules.TICKET, {
  service: TicketModuleService,
})

export * from "./models"
export { default as TicketModuleService } from "./services/ticket-module-service"
