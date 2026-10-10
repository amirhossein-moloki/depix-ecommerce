# Depix E-commerce Workspace

Welcome to the **Depix E-commerce** workspace repository. This monorepo workspace integrates Medusa v2 e-commerce engine and Payload CMS v4 into a unified monorepo infrastructure behind an Nginx reverse proxy.

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

Depix E-commerce is an enterprise-grade e-commerce monorepo workspace designed to deliver robust store operations alongside rich content management.

- **Medusa Backend (`medusa/`)**: Serves as the core headless e-commerce backend managing catalog, orders, carts, checkout, customer accounts, payment collection, and notification workflows.
- **Payload CMS (`payload/`)**: Serves as the headless content management system and content admin interface for dynamic page building, media management, articles, and marketing content.
- **Nginx Reverse Proxy (`infrastructure/nginx/`)**: Acts as the central gateway routing public and admin traffic to the appropriate application services.

---

## Architecture & Architecture Diagram

```text
                           ┌──────────────┐
                           │    Nginx     │
                           │  Port: 80    │
                           └──────┬───────┘
                                  │
             ┌────────────────────┴────────────────────┐
             │                                         │
       /api/medusa/                                 /payload/
             │                                     / (fallback)
             ▼                                         ▼
      ┌─────────────┐                           ┌─────────────┐
      │   Medusa    │                           │   Payload   │
      │   Backend   │                           │    CMS      │
      │  Port: 9000 │                           │  Port: 3000 │
      └──────┬──────┘                           └──────┬──────┘
             │                                         │
             ├────────────────────┬────────────────────┘
             │                    │
             ▼                    ▼
      ┌─────────────┐      ┌─────────────┐
      │ PostgreSQL  │      │    Redis    │
      │  Port: 5432 │      │  Port: 6379 │
      └─────────────┘      └─────────────┘
```

---

## Implemented Capabilities

### E-Commerce Backend (Medusa)
- **Product & Catalog Management**: Product categories, variants, tags, types, collections, pricing rules, and inventory management.
- **Iranian Payment Gateway Provider Integration**: Native custom provider module (`@medusajs/payment-gateway`) supporting Mellat, Zibal, Zarinpal, and Saman gateways.
- **SMS & Unified Notifications**: Agnostic SMS notification provider (`@medusajs/notification-sms`) supporting Iranian gateways (`kavenegar`, `smsir`, `melipayamak`, and local `fake` mock mode) with phone normalization (E.164 conversion) and log masking.
- **Product Video Module**: Custom product video extension (`@medusajs/product-video`) with support for YouTube, Vimeo, and Aparat video extraction and validation.
- **Customer Feature Suite**: Integrated wishlist management, product comparison, price alerts, stock alerts, and customer reviews.
- **Structured Data (SEO)**: Store Product JSON-LD serialization (`generateProductJsonLd`, `serializeJsonLd`) supporting `Schema.org/Product` and `Schema.org/VideoObject` via endpoint `GET /store/products/:id/json-ld`.

### Content Management (Payload CMS)
- **CMS Collections & Globals**: Flexible content model for pages, media, categories, posts, users, and site configurations.
- **Rich Text & Lexical Editor**: Advanced rich content creation with structured JSON-LD rendering (`generateArticleJsonLd`) and secure HTML escaping.
- **Comments & Moderation**: Comments collection with threaded replies and moderation workflows (`pending`, `approved`, `rejected`, `spam`).

---

## Technology Stack

- **Runtimes & Tooling**: Node.js v20+, TypeScript, Corepack, Turborepo
- **Package Managers**: Yarn v3 (Medusa workspace), PNPM v11 (Payload workspace)
- **E-Commerce Framework**: Medusa v2
- **CMS Framework**: Payload CMS v4 (Next.js-based)
- **Databases**: PostgreSQL 16 (via MikroORM / Drizzle), Redis 7
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
├── payload/                # Payload CMS v4 Workspace
│   ├── packages/           # Payload core packages & official plugins
│   ├── templates/          # Website and e-commerce templates
│   ├── package.json        # PNPM monorepo configuration
│   └── turbo.json          # Payload build pipeline
├── infrastructure/         # Shared Infrastructure Configurations
│   └── nginx/              # Nginx reverse proxy routing rules
│       └── nginx.conf
├── docker-compose.yml      # Local container orchestration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # Repository documentation
```

---

## Prerequisites

- **Node.js**: v20.x or higher
- **Corepack**: Enabled (`corepack enable`) to manage Yarn v3 and PNPM v11.
- **Docker**: Docker Desktop or Docker Engine with Docker Compose v2+.

---

## Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd depix-ecommerce
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

   For Payload CMS:
   ```bash
   cd payload
   corepack enable
   pnpm install
   cd ..
   ```

---

## Environment Configuration

All environment configurations are loaded from `.env` in the root workspace directory.

| Variable Name | Purpose | Required | Default Value |
|---|---|---|---|
| `NODE_ENV` | Application environment mode (`development`, `production`, `test`) | Optional | `development` |
| `NGINX_PORT` | Port for Nginx reverse proxy | Optional | `80` |
| `POSTGRES_USER` | PostgreSQL superuser username | **Required** | - |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | **Required** | - |
| `POSTGRES_DB` | Default database name for PostgreSQL container | Optional | `depix_db` |
| `POSTGRES_PORT` | PostgreSQL external port binding | Optional | `5432` |
| `MEDUSA_DB_NAME` | Database name for Medusa engine | Optional | `medusa_db` |
| `PAYLOAD_DB_NAME` | Database name for Payload CMS | Optional | `payload_db` |
| `MEDUSA_DATABASE_URL` | Direct connection string for Medusa database | **Required** | - |
| `PAYLOAD_DATABASE_URL` | Direct connection string for Payload database | **Required** | - |
| `REDIS_PORT` | Redis external port binding | Optional | `6379` |
| `REDIS_URL` | Redis connection URL | Optional | `redis://redis:6379` |
| `MEDUSA_PORT` | Port for Medusa server | Optional | `9000` |
| `MEDUSA_JWT_SECRET` | Secret key for signing Medusa JWT tokens | **Required** | - |
| `MEDUSA_COOKIE_SECRET` | Secret key for signing Medusa cookies | **Required** | - |
| `PAYLOAD_PORT` | Port for Payload CMS server | Optional | `3000` |
| `PAYLOAD_SECRET` | Secret key for signing Payload sessions/tokens | **Required** | - |
| `SMS_PROVIDER` | SMS Provider (`kavenegar`, `smsir`, `melipayamak`, `fake`) | Optional | `fake` |
| `SMS_API_KEY` | API key for the SMS gateway provider | Optional | - |
| `SMS_SENDER` | Configured SMS sender line or sender ID | Optional | - |
| `SMS_API_URL` | Gateway API endpoint URL override | Optional | - |
| `SMS_TIMEOUT` | Request timeout for SMS API dispatches (ms) | Optional | `5000` |
| `NOTIFICATION_RETRY_LIMIT` | Maximum retry attempts for dispatches | Optional | `3` |
| `SMS_ORDER_NOTIFICATIONS_ENABLED` | Enable order state SMS notifications | Optional | `true` |
| `SMS_ENABLE_OTP` | Enable OTP SMS verification dispatches | Optional | `true` |
| `PAYMENT_ENV` | Payment gateway environment (`development`, `production`) | Optional | `development` |
| `MELLAT_TERMINAL_ID` | Terminal ID for Mellat payment gateway | Optional | - |
| `MELLAT_USERNAME` | Username for Mellat payment gateway | Optional | - |
| `MELLAT_PASSWORD` | Password for Mellat payment gateway | Optional | - |
| `MELLAT_CALLBACK_URL` | Callback URL for Mellat payment gateway | Optional | - |
| `ZIBAL_MERCHANT` | Merchant key for Zibal payment gateway | Optional | - |
| `ZIBAL_CALLBACK_URL` | Callback URL for Zibal payment gateway | Optional | - |
| `ZARINPAL_ACCESS_TOKEN` | Access token for Zarinpal payment gateway | Optional | - |
| `ZARINPAL_MERCHANT_ID` | Merchant ID for Zarinpal payment gateway | Optional | - |
| `ZARINPAL_CALLBACK_URL` | Callback URL for Zarinpal payment gateway | Optional | - |
| `SAMAN_TERMINAL_ID` | Terminal ID for Saman payment gateway | Optional | - |
| `SAMAN_CALLBACK_URL` | Callback URL for Saman payment gateway | Optional | - |

---

## Running the Application

### 1. Docker Compose (Full Stack)

Start all services (PostgreSQL, Redis, Medusa, Payload, and Nginx) in detached mode:

```bash
docker compose up -d
```

View application logs:
```bash
docker compose logs -f
```

Stop all running containers:
```bash
docker compose down
```

### 2. Local Development (Individual Services)

To run Medusa in development mode locally:
```bash
cd medusa
yarn dev
```

To run Payload CMS in development mode locally:
```bash
cd payload
pnpm dev
```

---

## API Documentation & Routing

### Nginx Service Routes

When running through Docker Compose, Nginx routes incoming requests on port `80`:

| Route Prefix | Target Service | Purpose |
|---|---|---|
| `/health` | Nginx Inline (`200 OK`) | Reverse proxy healthcheck endpoint |
| `/api/medusa/` | Medusa (`http://medusa:9000/`) | Medusa Store & Admin API endpoints |
| `/payload/` | Payload CMS (`http://payload:3000/`) | Payload CMS admin & API endpoints |
| `/` | Payload CMS (`http://payload:3000`) | Default storefront fallback route |

### Key Medusa Store API Endpoints

- **Products & Catalog**:
  - `GET /store/products` - List products
  - `GET /store/products/:id` - Get product details
  - `GET /store/products/:id/json-ld` - Get Schema.org Product & VideoObject JSON-LD
  - `GET /store/products/:id/videos` - List product video attachments
- **Carts & Checkout**:
  - `POST /store/carts` - Create cart
  - `POST /store/carts/:id/line-items` - Add line item to cart
  - `POST /store/carts/:id/payment-sessions` - Initialize payment session
- **Customer Features**:
  - `GET /store/wishlist` - View customer wishlist
  - `POST /store/wishlist/items` - Add product variant to wishlist
  - `GET /store/comparison` - View product comparison list
  - `GET /store/notifications` - Retrieve customer notification feed

### Authentication Mechanisms

- **Medusa Backend**: Supports JWT bearer tokens and HTTP session cookies (`MEDUSA_JWT_SECRET`, `MEDUSA_COOKIE_SECRET`).
- **Payload CMS**: Uses JWT-based cookie sessions managed by Payload Auth.

---

## Database & Data Architecture

- **PostgreSQL 16**: Primary relational database service powering both applications via separate logical databases (`MEDUSA_DB_NAME` and `PAYLOAD_DB_NAME`).
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

### Payload CMS Workspace Commands

```bash
cd payload

# Run static code linting
pnpm lint

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:int
```

---

## Deployment Overview

- **Production Docker Strategy**: The included `docker-compose.yml` provides containerized orchestration using Node 20 Alpine containers for Medusa and Payload, PostgreSQL 16 Alpine, Redis 7 Alpine, and Nginx Alpine.
- **Environment Isolation**: Production deployments require establishing proper `DATABASE_URL` values, secure secrets (`MEDUSA_JWT_SECRET`, `MEDUSA_COOKIE_SECRET`, `PAYLOAD_SECRET`), and binding Nginx to SSL/TLS certificates (port `443`).
