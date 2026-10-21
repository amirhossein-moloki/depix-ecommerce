import { MiddlewareRoute } from "@medusajs/framework/http"
import { storeLocalesRoutesMiddlewares } from "./locales/middlewares"
import { storeNotificationRoutesMiddlewares } from "./notifications/middlewares"
import { storeReturnsRoutesMiddlewares } from "./returns/middlewares"
import { storeSearchRoutesMiddlewares } from "./search/middlewares"
import { storeTicketRoutesMiddlewares } from "./tickets/middlewares"

export const storeRoutesMiddlewares: MiddlewareRoute[] = [
  ...storeLocalesRoutesMiddlewares,
  ...storeNotificationRoutesMiddlewares,
  ...storeReturnsRoutesMiddlewares,
  ...storeSearchRoutesMiddlewares,
  ...storeTicketRoutesMiddlewares,
]
