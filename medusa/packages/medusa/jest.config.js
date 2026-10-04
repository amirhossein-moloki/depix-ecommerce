const defineJestConfig = require("../../define_jest_config")
const path = require("path")

module.exports = defineJestConfig({
  moduleNameMapper: {
    "^@models": "<rootDir>/src/models",
    "^@services": "<rootDir>/src/services",
    "^@types": "<rootDir>/src/types",
    "^@medusajs/deps/mikro-orm/core$": path.resolve(__dirname, "../../node_modules/@mikro-orm/core"),
    "^@medusajs/deps/mikro-orm/(.*)$": path.resolve(__dirname, "../../node_modules/@mikro-orm/$1"),
    "^@medusajs/deps/opentelemetry/api$": path.resolve(__dirname, "../../node_modules/@opentelemetry/api"),
    "^@medusajs/deps/(.*)$": path.resolve(__dirname, "../../node_modules/$1"),
    "^@medusajs/telemetry": path.resolve(__dirname, "../medusa-telemetry/src"),
    "^@medusajs/cli$": path.resolve(__dirname, "../cli/medusa-cli/src/index.ts"),
    "^@medusajs/cli/dist/reporter$": path.resolve(__dirname, "../cli/medusa-cli/src/reporter/index.ts"),
    "^@medusajs/cli/(.*)$": path.resolve(__dirname, "../cli/medusa-cli/src/$1"),
    "^@medusajs/types": path.resolve(__dirname, "../core/types/src"),
    "^@medusajs/utils": path.resolve(__dirname, "../core/utils/src"),
    "^@medusajs/query": path.resolve(__dirname, "../core/query/src"),
    "^@medusajs/workflows-sdk": path.resolve(__dirname, "../core/workflows-sdk/src"),
    "^@medusajs/modules-sdk": path.resolve(__dirname, "../core/modules-sdk/src"),
    "^@medusajs/orchestration": path.resolve(__dirname, "../core/orchestration/src"),
    "^@medusajs/framework/utils": path.resolve(__dirname, "../core/utils/src"),
    "^@medusajs/framework/types": path.resolve(__dirname, "../core/types/src"),
    "^@medusajs/framework/workflows-sdk": path.resolve(__dirname, "../core/workflows-sdk/src"),
    "^@medusajs/framework/http": path.resolve(__dirname, "../core/framework/src/http"),
    "^@medusajs/framework/zod": path.resolve(__dirname, "../../node_modules/zod"),
    "^@medusajs/framework/mikro-orm/(.*)": path.resolve(__dirname, "../core/framework/src/mikro-orm/$1"),
    "^@medusajs/framework": path.resolve(__dirname, "../core/framework/src"),
    "^@medusajs/core-flows": path.resolve(__dirname, "../core/core-flows/src"),
    "^@medusajs/recommendation": path.resolve(__dirname, "../modules/recommendation/src"),
  },
})
