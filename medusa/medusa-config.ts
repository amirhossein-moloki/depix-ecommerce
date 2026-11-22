import { defineConfig } from "@medusajs/framework/utils"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/depix_db",
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001,http://localhost:5173",
      authCors: process.env.AUTH_CORS || "http://localhost:7000,http://localhost:7001,http://localhost:5173",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    {
      key: "walletModuleService",
      resolve: "@medusajs/wallet",
    },
    {
      key: "payment",
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-wallet",
            id: "pp_wallet",
          },
        ],
      },
    },
  ],
})
