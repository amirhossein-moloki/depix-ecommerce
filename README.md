# Depix E-commerce Workspace

Welcome to the **Depix E-commerce** workspace repository. This workspace houses the Medusa v2 e-commerce backend behind an Nginx reverse proxy with PostgreSQL and Redis infrastructure.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture & Architecture Diagram](#architecture--architecture-diagram)
- [Implemented Capabilities](#implemented-capabilities)
- [Technology Stack](#technology-stack)
- [Workspace Project Structure](#workspace-project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation & Routing](#api-documentation--routing)
- [Database & Data Architecture](#database--data-architecture)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Deployment Overview](#deployment-overview)

---

## Project Overview

Depix E-commerce is an enterprise-grade e-commerce workspace designed to deliver robust store operations.

- **Medusa Backend (`medusa/`)**: Serves as the core headless e-commerce backend managing catalog, orders, carts, checkout, customer accounts, payment collection, and notification workflows.
- **Blog (`Blog/`)**: Integrated as an independent Git submodule tracking [`amirhossein-moloki/Blog`](https://github.com/amirhossein-moloki/Blog.git) (Python/Django blog platform).
- **Nginx Reverse Proxy (`infrastructure/nginx/`)**: Acts as the central gateway routing public and admin traffic to the backend service.

---

## Architecture & Architecture Diagram

```text
                           ┌──────────────┐
                           │    Nginx     │
                           │  Port: 80    │
                           └──────┬───────┘
                                  │
                        /api/medusa/ & / (fallback)
                                  │
                                  ▼
                           ┌─────────────┐
                           │   Medusa    │
                           │   Backend   │
                           │  Port: 9000 │
                           └──────┬──────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │ PostgreSQL  │             │    Redis    │
             │  Port: 5432 │             │  Port: 6379 │
             └─────────────┘             └─────────────┘
```

---

## Implemented Capabilities

### E-Commerce Backend (Medusa)
- **Product & Catalog Management**: Product categories, variants, tags, types, collections, pricing rules, and inventory management.
- **Iranian Payment Gateway Provider Integration**: Native custom provider module (`@medusajs/payment-gateway`) supporting Mellat, Zibal, Zarinpal, and Saman gateways.
- **Customer Wallet Module**: Internal customer wallet ledger (`@medusajs/wallet`) and `pp_wallet` payment provider (`@medusajs/payment-wallet`).
- **SMS & Unified Notifications**: Agnostic SMS notification provider (`@medusajs/notification-sms`) supporting Iranian gateways (`kavenegar`, `smsir`, `melipayamak`, and local `fake` mock mode) with phone normalization (E.164 conversion) and log masking.
- **Product Video Module**: Custom product video extension (`@medusajs/product-video`) with support for YouTube, Vimeo, and Aparat video extraction and validation.
- **Customer Feature Suite**: Integrated wishlist management, product comparison, price alerts, stock alerts, support ticketing, size guides, and customer reviews.
- **Structured Data (SEO)**: Store Product JSON-LD serialization (`generateProductJsonLd`, `serializeJsonLd`) supporting `Schema.org/Product` and `Schema.org/VideoObject` via endpoint `GET /store/products/:id/json-ld`.

---

## Technology Stack

- **Runtimes & Tooling**: Node.js v22+, TypeScript, Corepack, Turborepo
- **Package Manager**: Yarn v3 (Medusa workspace)
- **E-Commerce Framework**: Medusa v2
- **Databases**: PostgreSQL 16 (via MikroORM), Redis 7
- **Reverse Proxy**: Nginx (Alpine)
- **Containerization**: Docker & Docker Compose

---

## Workspace Project Structure

```text
depix-ecommerce/
├── medusa/                 # Medusa v2 E-Commerce Backend
│   ├── packages/
│   │   ├── medusa/         # Core Medusa engine & API routes
│   │   ├── modules/        # Domain modules (cart, product, order, product-video, etc.)
│   │   └── plugins/        # Custom Medusa plugins (loyalty, draft-order)
│   ├── package.json        # Yarn monorepo configuration
│   └── turbo.json          # Turbo build/test pipeline definitions
├── Blog/                   # Blog service (Git submodule -> amirhossein-moloki/Blog)
├── infrastructure/         # Shared Infrastructure Configurations
│   └── nginx/              # Nginx reverse proxy routing rules
│       └── nginx.conf
├── docker-compose.yml      # Local container orchestration
├── .env.example            # Environment variables template
├── .gitmodules             # Git submodule configuration
├── .gitignore              # Git ignore rules
└── README.md               # Repository documentation
```

---

## Prerequisites

- **Node.js**: v22.x (for local development)
- **Corepack**: Enabled (`corepack enable`) to manage Yarn v3.
- **Docker**: Docker Desktop or Docker Engine with Docker Compose v2+.

---

## Installation & Setup

1. **Clone the Repository (with Submodules)**:
   ```bash
   git clone --recursive <repository-url>
   cd depix-ecommerce
   ```

   If you already cloned the repository without `--recursive`, initialize the `Blog` submodule:
   ```bash
   git submodule update --init --recursive
   ```

2. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Fill in secrets and database configurations in `.env`.

3. **Install Dependencies**:

   For Medusa backend:
   ```bash
   cd medusa
   corepack enable
   yarn install
   cd ..
   ```

4. **Blog Submodule (`Blog/`)**:
   `Blog/` tracks `https://github.com/amirhossein-moloki/Blog.git` (Django/Daphne/Celery/PostgreSQL/Redis/Nginx) as an independent Git submodule.
   Note that `Blog/docker-compose.yml` binds host port `80` by default; if running the root `depix-ecommerce` and `Blog` Docker Compose stacks simultaneously, set `NGINX_PORT=8080` (or another free port) in the root `.env` and copy `Blog/.env.example` to `Blog/.env`.

---

## Environment Configuration

All environment configurations are loaded from `.env` in the root workspace directory.

| Variable Name | Purpose | Required | Default Value |
|---|---|---|---|
| `NODE_ENV` | Application environment mode (`development`, `production`, `test`) | Optional | `development` |
| `NGINX_PORT` | Port for Nginx reverse proxy | Optional | `80` |
| `POSTGRES_USER` | PostgreSQL superuser username | Optional | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | Optional | `postgres` |
| `POSTGRES_DB` | Default database name for PostgreSQL container | Optional | `depix_db` |
| `POSTGRES_PORT` | PostgreSQL external port binding | Optional | `5432` |
| `MEDUSA_DB_NAME` | Database name for Medusa engine | Optional | `medusa_db` |
| `MEDUSA_DATABASE_URL` | Direct connection string for Medusa database | Optional | `postgres://postgres:postgres@postgres:5432/depix_db?sslmode=disable` |
| `REDIS_PORT` | Redis external port binding | Optional | `6379` |
| `REDIS_URL` | Redis connection URL | Optional | `redis://redis:6379` |
| `MEDUSA_PORT` | Port for Medusa server | Optional | `9000` |
| `MEDUSA_JWT_SECRET` | Secret key for signing Medusa JWT tokens | Optional | `supersecret` |
| `MEDUSA_COOKIE_SECRET` | Secret key for signing Medusa cookies | Optional | `supersecret` |
| `DISABLE_MEDUSA_ADMIN` | Disable Medusa Admin bundle in headless server mode | Optional | `true` |
| `SMS_PROVIDER` | SMS Provider (`kavenegar`, `smsir`, `melipayamak`, `fake`) | Optional | `fake` |
| `SMS_API_KEY` | API key for the SMS gateway provider | Optional | - |
| `SMS_SENDER` | Configured SMS sender line or sender ID | Optional | - |
| `SMS_API_URL` | Gateway API endpoint URL override | Optional | - |
| `SMS_TIMEOUT` | Request timeout for SMS API dispatches (ms) | Optional | `5000` |
| `NOTIFICATION_RETRY_LIMIT` | Maximum retry attempts for dispatches | Optional | `3` |
| `SMS_ORDER_NOTIFICATIONS_ENABLED` | Enable order state SMS notifications | Optional | `true` |
| `SMS_ENABLE_OTP` | Enable OTP SMS verification dispatches | Optional | `true` |
| `PAYMENT_ENV` | Payment gateway environment (`sandbox`, `development`, `production`) | Conditional | `sandbox` |
| `APP_URL` | Frontend application origin for `/payment/success` and `/payment/failed` redirects (`https://` required in production) | Required when Zibal/production enabled | - |
| `PAYMENT_TIMEOUT_MS` | External payment gateway HTTP timeout (ms) | Optional | `15000` |
| `MELLAT_TERMINAL_ID` | Terminal ID for Mellat payment gateway | Optional | - |
| `MELLAT_USERNAME` | Username for Mellat payment gateway | Optional | - |
| `MELLAT_PASSWORD` | Password for Mellat payment gateway | Optional | - |
| `MELLAT_CALLBACK_URL` | Callback URL for Mellat payment gateway | Optional | - |
| `ZIBAL_MERCHANT` | Merchant key for Zibal payment gateway (test `'zibal'` is blocked in `production`) | Conditional | - |
| `ZIBAL_CALLBACK_URL` | Backend callback URL Zibal calls (`/payment/callback`) | Conditional | - |
| `ZARINPAL_ACCESS_TOKEN` | Access token for Zarinpal payment gateway | Optional | - |
| `ZARINPAL_MERCHANT_ID` | Merchant ID for Zarinpal payment gateway | Optional | - |
| `ZARINPAL_CALLBACK_URL` | Callback URL for Zarinpal payment gateway | Optional | - |
| `SAMAN_TERMINAL_ID` | Terminal ID for Saman payment gateway | Optional | - |
| `SAMAN_CALLBACK_URL` | Callback URL for Saman payment gateway | Optional | - |

---

## Running the Application

### 1. Docker Compose (Full Backend Stack)

Build and start all backend services (PostgreSQL, Redis, Medusa, and Nginx) in detached mode:

```bash
docker compose up -d --build
```

View application logs:
```bash
docker compose logs -f
```

Stop all running containers:
```bash
docker compose down
```

### 2. Local Development (Medusa)

To run Medusa locally:
```bash
cd medusa
yarn start
```

---

## API Documentation & Routing

### Nginx Service Routes

When running through Docker Compose, Nginx routes incoming requests on port `80`:

| Route Prefix | Target Service | Purpose |
|---|---|---|
| `/health` | Nginx Inline (`200 OK`) | Reverse proxy healthcheck endpoint |
| `/api/medusa/` | Medusa (`http://medusa:9000/`) | Medusa Store & Admin API endpoints |
| `/` | Medusa (`http://medusa:9000`) | Default backend fallback route |

### API Specification & Documentation UIs (Swagger UI & ReDoc)

The platform provides standard OpenAPI v3 spec generation alongside two complementary API documentation interfaces:

- **OpenAPI v3 Specification**: Available via `GET /api/medusa/openapi.json` for API schema consumers, Postman imports, and SDK generation.
- **Swagger UI**: Interactive API exploration and testing interface enabling direct request execution (`Try it out`), request header configuration, and live response inspection.
- **ReDoc UI**: Clean, three-panel responsive documentation interface providing structured schema rendering, search capabilities, and code samples for developer onboarding.

### Key Medusa Store API Endpoints

- **Products & Catalog**:
  - `GET /store/products` - List products
  - `GET /store/products/:id` - Get product details
  - `GET /store/products/:id/json-ld` - Get Schema.org Product & VideoObject JSON-LD
  - `GET /store/products/:id/videos` - List product video attachments
- **Carts & Checkout & Zibal Payment Flow**:
  - `POST /store/carts` - Create cart
  - `POST /store/carts/:id/line-items` - Add line item to cart
  - `POST /store/carts/:id/payment-sessions` - Initialize payment session (`provider: "zibal" | "zarinpal"`)
  - `POST /store/payments/initiate` - Initiate gateway payment and return `redirect_url` + `track_id`
  - `GET` / `POST /payment/callback` (and `/payment/callback/:gateway`) - Receive Zibal browser/gateway callback, verify transaction server-side with Zibal, complete cart idempotently once, and `302` redirect to `${APP_URL}/payment/success` or `${APP_URL}/payment/failed`
  - `POST /store/payments/verify` - Verify payment server-side and complete order idempotently
  - `GET /store/payments/:id/inquiry` - Inquire payment status directly from Zibal

### Zibal Payment Platform Setup (`@amirhossein-moloki/payment-*`)

The backend integrates `@amirhossein-moloki/payment-core`, `@amirhossein-moloki/payment-zibal`, `@amirhossein-moloki/payment-service`, and `@amirhossein-moloki/payment-persistence-postgres` as workspace packages inside `medusa/packages/`.

#### 1. Configure Environment Variables

**Sandbox (Local Development):**
```env
APP_URL=http://localhost:3000
PAYMENT_ENV=sandbox
ZIBAL_MERCHANT=zibal
ZIBAL_CALLBACK_URL=http://localhost/api/medusa/payment/callback
```

**Production (Separate Frontend & API Domains Supported):**
```env
APP_URL=https://example.com
PAYMENT_ENV=production
ZIBAL_MERCHANT=your_production_merchant
ZIBAL_CALLBACK_URL=https://api.example.com/payment/callback
```

> At startup, Medusa validates `APP_URL`, `ZIBAL_MERCHANT`, `ZIBAL_CALLBACK_URL`, and `PAYMENT_ENV`. Using merchant `'zibal'` or non-HTTPS `APP_URL` in `production` fails startup with `ConfigurationError`.

#### 2. Payment Initiation & Server-Side Callback Redirect Flow

```ts
// Frontend initiates checkout payment:
const res = await fetch('/api/medusa/store/payments/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
  body: JSON.stringify({ cart_id: cartId, provider: 'zibal' }),
});
const { redirect_url } = await res.json();
window.location.href = redirect_url; // -> https://gateway.zibal.ir/start/{trackId}
```

After payment, Zibal sends the user back to `ZIBAL_CALLBACK_URL` (`/payment/callback` on Medusa). Medusa parses `trackId` and `success`, verifies directly with Zibal `/v1/verify` (including amount matching and idempotency against `payments` / `transactions` / `idempotency_records`), fulfills the order **at most once**, and redirects (`302`) to:
- `${APP_URL}/payment/success?payment_id=...&order_id=...&track_id=...&ref_id=...`
- `${APP_URL}/payment/failed?payment_id=...&track_id=...&reason=...`
- **Customer Features**:
  - `GET /store/wishlist` - View customer wishlist
  - `POST /store/wishlist/items` - Add product variant to wishlist
  - `GET /store/comparison` - View product comparison list
  - `GET /store/notifications` - Retrieve customer notification feed

### Authentication Mechanisms

- **Medusa Backend**: Supports JWT bearer tokens and HTTP session cookies (`MEDUSA_JWT_SECRET`, `MEDUSA_COOKIE_SECRET`).

---

## Database & Data Architecture

- **PostgreSQL 16**: Primary relational database service powering the Medusa e-commerce backend (`MEDUSA_DB_NAME` / `POSTGRES_DB`).
- **Redis 7**: Used by Medusa for session caching, event bus messaging, and workflow execution states.

---

## Testing & Quality Assurance

### Medusa Workspace Commands

```bash
cd medusa

# Run static code linting
yarn lint

# Run Medusa-specific linting configuration
yarn lint:medusa

# Run unit tests
yarn test

# Run HTTP integration tests
yarn test:integration:http
```

---

## Deployment Overview

- **Production Docker Strategy**: The included `docker-compose.yml` provides containerized orchestration using a custom Node 22 Medusa image, PostgreSQL 16 Alpine, Redis 7 Alpine, and Nginx Alpine.
- **Environment Isolation**: Production deployments require establishing proper `DATABASE_URL` values, secure secrets (`MEDUSA_JWT_SECRET`, `MEDUSA_COOKIE_SECRET`), and binding Nginx to SSL/TLS certificates (port `443`).
