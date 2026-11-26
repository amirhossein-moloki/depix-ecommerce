# @amirhossein-moloki/payment-zibal

Zibal IPG provider implementation for `@amirhossein-moloki/payment-core` and `@amirhossein-moloki/payment-service`.

## Source of Truth

Implemented directly against the official Zibal IPG v1 API specification (`/v1/request`, `/start/{trackId}`, `/v1/verify`, `/v1/inquiry`). All amounts sent to Zibal are in **Iranian Rials (`IRR`)** (`>= 1000` IRR). `IRT` / `TOMAN` inputs are converted once (`* 10`); `IRR` inputs are passed through unchanged without double conversion.

## Installation

Inside this workspace (`medusa/packages/payment-zibal`), `@amirhossein-moloki/payment-*` packages are linked via Yarn workspaces (`"workspace:*"`).

When installing from GitHub Packages in an external project, configure `.npmrc`:

```ini
@amirhossein-moloki:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

And install:

```bash
pnpm add @amirhossein-moloki/payment-zibal @amirhossein-moloki/payment-core @amirhossein-moloki/payment-service @amirhossein-moloki/payment-persistence-postgres
```

## Environment Variables

```env
PAYMENT_ENV=sandbox
APP_URL=http://localhost:3000
ZIBAL_MERCHANT=zibal
ZIBAL_CALLBACK_URL=http://localhost:9000/payment/callback
PAYMENT_TIMEOUT_MS=15000
```

| Variable | Description | Production Requirement |
|---|---|---|
| `PAYMENT_ENV` | `sandbox` / `development` or `production` | `production` |
| `APP_URL` | Frontend application origin for `/payment/success` and `/payment/failed` redirects (trailing slashes stripped automatically) | Valid `https://` URL |
| `ZIBAL_MERCHANT` | Zibal merchant code (never exposed to frontend or logs) | Real merchant (never `'zibal'`) |
| `ZIBAL_CALLBACK_URL` | Backend callback endpoint called by Zibal (`GET` or `POST`) | Valid HTTP(S) URL |
| `PAYMENT_TIMEOUT_MS` | Request timeout in milliseconds | Positive integer (`15000` default) |

## Gateway Registration & Service Usage

```ts
import { GatewayRegistry } from '@amirhossein-moloki/payment-core';
import { PaymentApplicationService } from '@amirhossein-moloki/payment-service';
import {
  PostgresIdempotencyRepository,
  PostgresPaymentRepository,
  PostgresTransactionRepository,
} from '@amirhossein-moloki/payment-persistence-postgres';
import { ZibalGateway, toZibalRialAmount } from '@amirhossein-moloki/payment-zibal';

const registry = new GatewayRegistry();
registry.register(
  new ZibalGateway({
    gatewayId: 'zibal',
    merchant: process.env.ZIBAL_MERCHANT!,
    callbackUrl: process.env.ZIBAL_CALLBACK_URL!,
    environment: process.env.PAYMENT_ENV === 'production' ? 'production' : 'sandbox',
    timeoutMs: Number(process.env.PAYMENT_TIMEOUT_MS || 15000),
  }),
);

const service = new PaymentApplicationService({
  registry,
  paymentRepository: new PostgresPaymentRepository(pool),
  transactionRepository: new PostgresTransactionRepository(pool),
  idempotencyRepository: new PostgresIdempotencyRepository(pool),
});

// 1. Create Payment (amount in IRR)
const amountIrr = toZibalRialAmount(500000, 'IRR');
const created = await service.createPayment({
  gateway: 'zibal',
  amount: amountIrr,
  currency: 'IRR',
  callbackUrl: process.env.ZIBAL_CALLBACK_URL,
  description: 'Order checkout',
  metadata: { cart_id: 'cart_123' },
});
// Redirect user to created.redirectUrl (https://gateway.zibal.ir/start/{trackId})

// 2. Parse Browser Callback & Verify Server-Side
const callback = await service.handleCallback('zibal', {
  query: req.query,
  body: req.body,
  headers: req.headers,
});

if (callback.isSuccess && callback.payment && callback.gatewayTransactionId) {
  const verified = await service.verifyPayment({
    paymentId: callback.payment.id,
    gatewayTransactionId: callback.gatewayTransactionId,
    callbackData: callback.rawData,
  });
  // verified.status === 'SUCCESS', verified.reference === refNumber
}

// 3. Inquire Payment Status
const inquiry = await service.inquirePayment(created.payment.id);
```

## Capabilities

- `CREATE_PAYMENT` (`/v1/request`)
- `VERIFY` (`/v1/verify`) with amount mismatch protection & result `201` idempotency
- `INQUIRY` (`/v1/inquiry`)
- `CALLBACK` (`parseCallback` for `query` and `body`)

## Sandbox vs Production Setup

### Sandbox Testing
- Set `PAYMENT_ENV=sandbox`
- Set `ZIBAL_MERCHANT=zibal`
- Set `APP_URL=http://localhost:3000`
- Set `ZIBAL_CALLBACK_URL=http://localhost:9000/payment/callback`
- Zibal test requests hit `https://gateway.zibal.ir` with merchant `'zibal'` and do not move real funds.

### Production Setup
- Set `PAYMENT_ENV=production`
- Set `APP_URL=https://example.com` (`https:` is enforced at startup)
- Set `ZIBAL_MERCHANT=<your-production-merchant>` (`'zibal'` is rejected with `ConfigurationError`)
- Set `ZIBAL_CALLBACK_URL=https://api.example.com/payment/callback`

## Running Tests

```bash
# Inside medusa workspace
node .yarn/releases/yarn-3.2.1.cjs workspace @amirhossein-moloki/payment-zibal build
node .yarn/releases/yarn-3.2.1.cjs workspace @amirhossein-moloki/payment-zibal test
```
