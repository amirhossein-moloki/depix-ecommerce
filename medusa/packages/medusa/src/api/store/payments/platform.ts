import {
  GatewayRegistry,
  IdempotencyRepository,
  PaymentRepository,
  TransactionRepository,
  WebhookEventRepository,
} from "@amirhossein-moloki/payment-core"
import {
  DatabaseMigrator,
  PostgresIdempotencyRepository,
  PostgresPaymentRepository,
  PostgresTransactionRepository,
  PostgresWebhookEventRepository,
} from "@amirhossein-moloki/payment-persistence-postgres"
import {
  ConsoleLogger,
  PaymentApplicationService,
  PaymentLogger,
} from "@amirhossein-moloki/payment-service"
import { HttpTransport, ZibalGateway } from "@amirhossein-moloki/payment-zibal"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import * as path from "path"
import { Pool } from "pg"
import { loadZibalRuntimeConfig, ZibalRuntimeConfig } from "./config"

export interface PaymentPlatformRepositories {
  paymentRepository: PaymentRepository
  transactionRepository: TransactionRepository
  idempotencyRepository?: IdempotencyRepository
  webhookEventRepository?: WebhookEventRepository
}

export interface PaymentPlatformRuntime {
  service: PaymentApplicationService
  registry: GatewayRegistry
  config: ZibalRuntimeConfig
  paymentRepo: PaymentRepository
  transactionRepo: TransactionRepository
  shutdown?: () => Promise<void>
}

export interface CreatePaymentPlatformOptions {
  env?: NodeJS.ProcessEnv
  config?: ZibalRuntimeConfig
  databaseUrl?: string
  repositories?: PaymentPlatformRepositories
  transport?: HttpTransport
  logger?: PaymentLogger
  runMigrations?: boolean
}

let cachedRuntimePromise: Promise<PaymentPlatformRuntime> | null = null
let runtimeOverride: PaymentPlatformRuntime | null = null

export function setPaymentPlatformOverride(
  runtime: PaymentPlatformRuntime | null
): void {
  runtimeOverride = runtime
  if (!runtime) {
    cachedRuntimePromise = null
  }
}

function resolvePostgresMigrationsDir(): string {
  const entryPath = require.resolve(
    "@amirhossein-moloki/payment-persistence-postgres"
  )
  return path.resolve(path.dirname(entryPath), "../migrations")
}

export async function createPaymentPlatform(
  options: CreatePaymentPlatformOptions = {}
): Promise<PaymentPlatformRuntime> {
  const config =
    options.config ?? loadZibalRuntimeConfig(options.env ?? process.env)

  const registry = new GatewayRegistry()
  const zibalGateway = new ZibalGateway(
    {
      gatewayId: "zibal",
      merchant: config.merchant,
      callbackUrl: config.callbackUrl,
      environment: config.environment,
      timeoutMs: config.timeoutMs,
    },
    options.transport
  )
  registry.register(zibalGateway)

  let pool: Pool | undefined
  let paymentRepo: PaymentRepository
  let transactionRepo: TransactionRepository
  let idempotencyRepo: IdempotencyRepository | undefined
  let webhookEventRepo: WebhookEventRepository | undefined

  if (options.repositories) {
    paymentRepo = options.repositories.paymentRepository
    transactionRepo = options.repositories.transactionRepository
    idempotencyRepo = options.repositories.idempotencyRepository
    webhookEventRepo = options.repositories.webhookEventRepository
  } else {
    const databaseUrl =
      options.databaseUrl ||
      options.env?.DATABASE_URL ||
      options.env?.MEDUSA_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.MEDUSA_DATABASE_URL

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is required to initialize payment Postgres persistence"
      )
    }

    pool = new Pool({ connectionString: databaseUrl })
    if (options.runMigrations !== false) {
      const migrator = new DatabaseMigrator(pool)
      await migrator.runMigrationFiles(resolvePostgresMigrationsDir())
    }

    paymentRepo = new PostgresPaymentRepository(pool)
    transactionRepo = new PostgresTransactionRepository(pool)
    idempotencyRepo = new PostgresIdempotencyRepository(pool)
    webhookEventRepo = new PostgresWebhookEventRepository(pool)
  }

  const service = new PaymentApplicationService({
    registry,
    paymentRepository: paymentRepo,
    transactionRepository: transactionRepo,
    idempotencyRepository: idempotencyRepo,
    webhookEventRepository: webhookEventRepo,
    logger: options.logger ?? new ConsoleLogger(),
    config: {
      defaultTimeoutMs: config.timeoutMs,
      retryPolicy: {
        maxAttempts: 2,
        initialDelayMs: 200,
      },
    },
  })

  return {
    service,
    registry,
    config,
    paymentRepo,
    transactionRepo,
    shutdown: pool ? () => pool!.end() : undefined,
  }
}

export async function getPaymentPlatform(
  scope?: MedusaContainer
): Promise<PaymentPlatformRuntime> {
  if (runtimeOverride) {
    return runtimeOverride
  }

  if (!cachedRuntimePromise) {
    let databaseUrl: string | undefined
    if (scope) {
      try {
        const configModule = scope.resolve<any>(
          ContainerRegistrationKeys.CONFIG_MODULE
        )
        databaseUrl = configModule?.projectConfig?.databaseUrl
      } catch {
        // Fallback to environment variables
      }
    }

    cachedRuntimePromise = createPaymentPlatform({ databaseUrl }).catch(
      (err) => {
        cachedRuntimePromise = null
        throw err
      }
    )
  }

  return cachedRuntimePromise
}
