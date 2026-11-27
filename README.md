# Depix E-commerce Workspace

Welcome to the **Depix E-commerce** workspace repository. This workspace houses the **Medusa v2** e-commerce backend (`medusa/`) and the **Django Blog CMS** (`Blog/` Git submodule) orchestrated through a unified root Docker Compose stack behind a shared **Nginx** reverse proxy, **PostgreSQL 16**, and **Redis 7**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture Overview & Diagram](#architecture-overview--diagram)
- [Service Responsibilities](#service-responsibilities)
- [Port Assignments](#port-assignments)
- [Implemented Capabilities](#implemented-capabilities)
- [Technology Stack](#technology-stack)
- [Workspace Project Structure](#workspace-project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running & Managing the Unified Stack](#running--managing-the-unified-stack)
- [Nginx Reverse Proxy Routing](#nginx-reverse-proxy-routing)
- [API Documentation & Endpoints](#api-documentation--endpoints)
- [Database, Redis & Persistent Storage](#database-redis--persistent-storage)
- [Independent Development Workflows](#independent-development-workflows)
- [Updating the Blog Submodule](#updating-the-blog-submodule)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Troubleshooting](#troubleshooting)
- [Deployment Overview](#deployment-overview)

---

## Project Overview

Depix E-commerce is an enterprise-grade e-commerce workspace designed to run both the commerce engine and the editorial blog platform seamlessly together while keeping their codebases, databases, and development lifecycles decoupled:

- **Medusa Backend (`medusa/`)**: Node.js 22 / TypeScript headless e-commerce backend managing catalog, orders, carts, checkout, customer accounts, wallet, payment gateways (Zibal, Zarinpal, Mellat, Saman, Wallet), and notification workflows.
- **Blog Platform (`Blog/`)**: Integrated as an independent Git submodule tracking [`amirhossein-moloki/Blog`](https://github.com/amirhossein-moloki/Blog.git) — a Python 3.12 / Django 5.2 / Daphne ASGI / Celery / Django Channels CMS managing articles, categories, tags, series, podcasts, media uploads, comments, reactions, and scheduled publishing/backups.
- **Nginx Reverse Proxy (`infrastructure/nginx/`)**: Central HTTP gateway routing public, API, static, and media traffic for both Medusa and Blog on a single entrypoint (`NGINX_PORT`, default `80`).
- **PostgreSQL Initializer (`infrastructure/postgres/`)**: Idempotent provisioning script executed on container startup to ensure logical database and role isolation for the Blog service on the shared PostgreSQL 16 instance.

---

## Architecture Overview & Diagram

```text
                                 [ Client / Browser / API Consumer ]
                                                  │
                                       Port 80 (${NGINX_PORT})
                                                  ▼
                                      ┌───────────────────────┐
                                      │      depix-nginx      │
                                      │    (nginx:alpine)     │
                                      └───────────┬───────────┘
                                                  │
          ┌───────────────────────┬───────────────┴───────────────┬──────────────────────┐
          │ /api/medusa/* & /     │ /blog/*                       │ /blog/static/*       │ /blog/media/*
          ▼                       ▼                               ▼                      ▼
┌───────────────────┐   ┌───────────────────┐            ┌──────────────────┐   ┌──────────────────┐
│   depix-medusa    │   │    depix-blog     │            │ blog_static (ro) │   │ blog_media (ro)  │
│  Medusa v2 (9000) │   │ Daphne ASGI (8000)│            └──────────────────┘   └──────────────────┘
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │          ┌──────────────────────────┐
          │                       │          │  depix-blog-celery-beat  │
          │                       │          └────────────┬─────────────┘
          │                       │                       │ schedules
          │                       │          ┌────────────▼─────────────┐
          │                       │          │ depix-blog-celery-worker │
          │                       │          │(high_priority,default,low│
          │                       │          └────────────┬─────────────┘
          │                       │                       │
          ├───────────────────────┼───────────────────────┤
          │                       │                       │
          ▼                       ▼                       ▼
┌───────────────────────────────────────┐       ┌────────────────────────────────────────┐
│            depix-postgres             │       │              depix-redis               │
│          PostgreSQL 16 (5432)         │       │             Redis 7 (6379)             │
│                                       │       │                                        │
│  • depix_db   (owner: postgres)       │       │  • DB 0: Blog Celery Broker & Channels │
│  • blog_db    (owner: blog_user)      │       │  • DB 1: Blog Django Cache             │
│    ▲ provisioned by depix-db-init     │       │  • DB 2: Medusa Sessions / Cache       │
└───────────────────────────────────────┘       └────────────────────────────────────────┘
```

All services communicate over the shared Docker bridge network `depix-network` (`depix_network`).

---

## Service Responsibilities

| Service | Container Name | Image / Build Context | Responsibility |
|---|---|---|---|
| `postgres` | `depix-postgres` | `postgres:16-alpine` | Shared PostgreSQL 16 engine hosting isolated `depix_db` and `blog_db` databases |
| `db-init` | `depix-db-init` | `postgres:16-alpine` | One-shot idempotent bootstrapper (`init-databases.sh`) creating/updating `blog_user`, `blog_db`, and PostgreSQL 16 `public` schema ownership |
| `redis` | `depix-redis` | `redis:7-alpine` | Shared Redis 7 instance serving logically isolated DBs `0`, `1`, and `2` |
| `medusa` | `depix-medusa` | `./medusa/Dockerfile` | Medusa v2 API server (`0.0.0.0:9000`); runs `medusa db:migrate` on startup |
| `blog` | `depix-blog` | `./Blog/Dockerfile` | Django 5.2 ASGI server (Daphne `0.0.0.0:8000`); runs `migrate` and `collectstatic` on startup |
| `blog-celery-worker` | `depix-blog-celery-worker` | `./Blog/Dockerfile` | Consolidated Celery worker consuming `high_priority`, `default`, and `low_priority` queues |
| `blog-celery-beat` | `depix-blog-celery-beat` | `./Blog/Dockerfile` | Celery Beat scheduler for periodic publishing and backup tasks |
| `nginx` | `depix-nginx` | `nginx:alpine` | Reverse proxy gateway and static/media file server for Medusa and Blog |

---

## Port Assignments

| Host Binding | Container Port | Service | Purpose |
|---|---|---|---|
| `0.0.0.0:${NGINX_PORT:-80}` | `80` | `nginx` | Unified HTTP gateway (`/api/medusa/`, `/blog/`, `/blog/static/`, `/blog/media/`, `/`) |
| `0.0.0.0:${MEDUSA_PORT:-9000}` | `9000` | `medusa` | Direct access to Medusa v2 backend API |
| `0.0.0.0:${BLOG_PORT:-8000}` | `8000` | `blog` | Direct access to Blog Django/Daphne ASGI server |
| `127.0.0.1:${POSTGRES_PORT:-5432}` | `5432` | `postgres` | Localhost-bound PostgreSQL 16 access |
| `127.0.0.1:${REDIS_PORT:-6379}` | `6379` | `redis` | Localhost-bound Redis 7 access |

---

## Implemented Capabilities

### E-Commerce Backend (Medusa)
- **Product & Catalog Management**: Product categories, variants, tags, types, collections, pricing rules, and inventory management.
- **Iranian Payment Gateway Provider Integration**: Native custom provider module (`@medusajs/payment-gateway`) supporting Mellat, Zibal, Zarinpal, and Saman gateways.
- **Customer Wallet Module**: Internal customer wallet ledger (`@medusajs/wallet`) and `pp_wallet` payment provider (`@medusajs/payment-wallet`).
- **SMS & Unified Notifications**: Agnostic SMS notification provider (`@medusajs/notification-sms`) supporting Iranian gateways (`kavenegar`, `smsir`, `melipayamak`, and local `fake` mock mode) with phone normalization (E.164 conversion) and log masking.
- **Product Video Module**: Custom product video extension (`@medusajs/product-video`) with support for YouTube, Vimeo, and Aparat video extraction and validation.
- **Customer Feature Suite**: Integrated wishlist management, product comparison, price alerts, stock alerts, support ticketing, size guides, banners, brands, invoices, and customer reviews.
- **Structured Data (SEO)**: Store Product JSON-LD serialization (`generateProductJsonLd`, `serializeJsonLd`) supporting `Schema.org/Product` and `Schema.org/VideoObject` via endpoint `GET /store/products/:id/json-ld`.

### Blog CMS (Submodule `Blog/`)
- **Content & Editorial API**: Articles, categories, tags, series, revisions, author profiles, podcasts, and gallery items with DRF standardized responses and OpenAPI documentation (`/blog/api/schema/swagger-ui/`, `/blog/api/schema/redoc/`).
- **Rich Text & Media Pipeline**: CKEditor 5 inline media uploads, AVIF/image variant generation via Celery, and local or S3-compatible object storage.
- **Engagement & Real-time Support**: Comments, reactions, Django Channels WebSocket routing, and Redis-backed caching (`MessagePack` + `Zstd`).
- **Backup & Disaster Recovery (BDR)**: Scheduled Celery Beat tasks for encrypted database/media/config backups and validation.

---

## Technology Stack

- **Medusa Runtime & Tooling**: Node.js v22, TypeScript, Corepack, Yarn v3, Turborepo, MikroORM
- **Blog Runtime & Tooling**: Python 3.12, Django 5.2, Django REST Framework, Daphne (ASGI), Celery 5.5, Django Channels
- **Databases & Broker**: PostgreSQL 16 (Alpine), Redis 7 (Alpine)
- **Reverse Proxy**: Nginx (Alpine)
- **Containerization**: Docker & Docker Compose v2+

---

## Workspace Project Structure

```text
depix-ecommerce/
├── medusa/                         # Medusa v2 E-Commerce Backend
│   ├── packages/
│   │   ├── medusa/                 # Core Medusa engine & API routes
│   │   ├── modules/                # Domain modules & providers
│   │   └── plugins/                # Custom Medusa plugins
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── .dockerignore
│   ├── package.json                # Yarn monorepo configuration
│   └── turbo.json                  # Turbo build/test pipeline definitions
├── Blog/                           # Blog CMS (Git submodule -> amirhossein-moloki/Blog)
│   ├── blog/                       # Django project settings, ASGI, Celery, URLs
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── docker-compose.yml          # Standalone Blog compose file (independent workflow)
│   └── requirements.txt
├── infrastructure/                 # Shared Infrastructure Configurations
│   ├── nginx/
│   │   └── nginx.conf              # Unified reverse proxy routing for Medusa & Blog
│   └── postgres/
│       └── init-databases.sh       # Idempotent PostgreSQL role/database bootstrap script
├── docker-compose.yml              # Unified root container orchestration
├── .env.example                    # Root Compose & Medusa environment template
├── .env.blog.example               # Blog application settings template for root Compose
├── .gitmodules                     # Git submodule configuration
├── .gitignore                      # Git ignore rules
└── README.md                       # Repository documentation
```

---

## Prerequisites

- **Docker**: Docker Engine / Docker Desktop with Docker Compose v2+.
- **Git**: With submodule support (`git submodule`).
- **Node.js v22.x + Corepack** (optional, for local Medusa development outside Docker).
- **Python 3.12** (optional, for local Blog development outside Docker).

---

## Installation & Setup

1. **Clone the Repository (with Submodules)**:
   ```bash
   git clone --recursive <repository-url>
   cd depix-ecommerce
   ```

   If you already cloned without `--recursive`, initialize the `Blog` submodule:
   ```bash
   git submodule update --init --recursive
   ```

2. **Configure Environment Files**:
   ```bash
   cp .env.example .env
   cp .env.blog.example .env.blog
   ```
   Review `.env` and `.env.blog` and replace placeholder secrets (`MEDUSA_JWT_SECRET`, `MEDUSA_COOKIE_SECRET`, `SECRET_KEY`, `STATIC_API_KEY`, database passwords, payment keys) before production use.

3. **Build and Start the Unified Stack**:
   ```bash
   docker compose build
   docker compose up -d
   ```

---

## Environment Variables

Configuration is split cleanly so there is no overlap between root infrastructure orchestration and Blog-specific application features:

1. **Root `.env`** (from [`.env.example`](file:///home/amir/github-projects/depix-ecommerce/.env.example)): Controls Docker Compose ports, PostgreSQL credentials, Redis DB isolation URLs, Medusa settings, and Blog infrastructure/subpath variables (`BLOG_*`).
2. **Root `.env.blog`** (from [`.env.blog.example`](file:///home/amir/github-projects/depix-ecommerce/.env.blog.example), loaded with `required: false` into `blog`, `blog-celery-worker`, and `blog-celery-beat`): Controls Blog-only application secrets and features (`SECRET_KEY`, `STATIC_API_KEY`, `EMAIL_*`, `AWS_*`, `BACKUP_*`, `CORS_*`, `CELERY_*` tuning).

### Root Orchestration, Medusa & Blog Infrastructure Variables (`.env`)

| Variable Name | Purpose | Default Value |
|---|---|---|
| `NODE_ENV` | Medusa application mode (`development`, `production`, `test`) | `development` |
| `NGINX_PORT` | Host port exposed by Nginx reverse proxy | `80` |
| `POSTGRES_USER` | PostgreSQL superuser username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | `postgres` |
| `POSTGRES_DB` | Primary PostgreSQL database name for Medusa | `depix_db` |
| `POSTGRES_PORT` | Localhost port binding for PostgreSQL | `5432` |
| `MEDUSA_DATABASE_URL` | Medusa PostgreSQL connection string | `postgres://postgres:postgres@postgres:5432/depix_db?sslmode=disable` |
| `REDIS_PORT` | Localhost port binding for Redis | `6379` |
| `MEDUSA_REDIS_URL` | Medusa Redis connection URL (DB 2) | `redis://redis:6379/2` |
| `BLOG_REDIS_URL` | Blog Redis base URL (**omit `/<db>`**; Blog appends `/1` for `CACHES` and uses DB `0` for Celery/Channels) | `redis://redis:6379` |
| `MEDUSA_PORT` | Host port exposed directly by Medusa | `9000` |
| `MEDUSA_JWT_SECRET` | Secret key for signing Medusa JWT tokens | `supersecret` |
| `MEDUSA_COOKIE_SECRET` | Secret key for signing Medusa cookies | `supersecret` |
| `DISABLE_MEDUSA_ADMIN` | Disable Medusa Admin UI bundle in headless mode | `true` |
| `SKIP_OTP` | Dev OTP bypass (`'00000'` when `true`/`1`) | `false` |
| `BLOG_PORT` | Host port exposed directly by Blog | `8000` |
| `BLOG_DB_NAME` | Isolated PostgreSQL database name for Blog | `blog_db` |
| `BLOG_DB_USER` | Isolated PostgreSQL role for Blog | `blog_user` |
| `BLOG_DB_PASSWORD` | Password for `BLOG_DB_USER` | `blog_password` |
| `BLOG_DATABASE_URL` | Optional override for Blog PostgreSQL URL | Auto-constructed from `BLOG_DB_*` |
| `BLOG_USE_REDIS` | Enable Redis caching, Celery broker, and Channels for Blog | `True` |
| `BLOG_DEBUG` | Django `DEBUG` mode for Blog | `True` |
| `BLOG_ALLOWED_HOSTS` | Comma-separated `ALLOWED_HOSTS` for Blog | `localhost,127.0.0.1,blog` |
| `BLOG_FORCE_SCRIPT_NAME` | Subpath prefix when mounted behind Nginx | `/blog` |
| `BLOG_STATIC_URL` | Public URL prefix for Blog static assets | `/blog/static/` |
| `BLOG_MEDIA_URL` | Public URL prefix for Blog uploaded media | `/blog/media/` |
| `BLOG_SECURE_SSL_REDIRECT` | Force HTTPS redirect in Django (set `True` behind TLS in production) | `False` |
| `BLOG_SESSION_COOKIE_SECURE` | Secure session cookie flag (set `True` over HTTPS) | `False` |
| `BLOG_CSRF_COOKIE_SECURE` | Secure CSRF cookie flag (set `True` over HTTPS) | `False` |
| `BLOG_CSRF_TRUSTED_ORIGINS` | Trusted origins for Django CSRF verification | `http://localhost,http://127.0.0.1,http://localhost:8000,http://localhost:3000` |
| `BLOG_CELERY_CONCURRENCY` | Concurrency for the consolidated `blog-celery-worker` container | `2` |
| `SMS_PROVIDER` / `SMS_*` | SMS provider configuration (`fake`, `kavenegar`, `smsir`, `melipayamak`) | `fake` |
| `PAYMENT_ENV` / `APP_URL` / `ZIBAL_*` / `ZARINPAL_*` / `MELLAT_*` / `SAMAN_*` | Payment gateway environment, callback URLs, and merchant credentials | `sandbox` |

### Blog Application Variables (`.env.blog`)

See [`.env.blog.example`](file:///home/amir/github-projects/depix-ecommerce/.env.blog.example) for `SECRET_KEY`, `STATIC_API_KEY`, `DOMAIN`, `SITE_NAME`, `FRONTEND_URL`, `CORS_*`, `USE_X_FORWARDED_*`, `STORAGE_BACKEND`, `AWS_*`, `BACKUP_*`, `EMAIL_*`, and `CELERY_*` task limits. For full Blog variable semantics, refer to [`Blog/docs/ENVIRONMENT_VARIABLES.md`](file:///home/amir/github-projects/depix-ecommerce/Blog/docs/ENVIRONMENT_VARIABLES.md).

---

## Running & Managing the Unified Stack

All commands are executed from the workspace root directory:

```bash
# Validate and inspect resolved Docker Compose configuration
docker compose config

# Build (or rebuild) Medusa and Blog images
docker compose build

# Start all services in detached mode (automatically initializes blog_db & runs migrations)
docker compose up -d

# Check container status and health checks
docker compose ps -a

# Stream logs across all services (or filter by service name, e.g. blog medusa nginx)
docker compose logs -f

# Stop and remove containers while preserving persistent volumes
docker compose down
```

> [!CAUTION]
> **Do NOT run `docker compose down -v`** unless you explicitly intend to wipe all PostgreSQL databases (`depix_db` and `blog_db`), Redis data, uploaded media, and backups.

---

## Nginx Reverse Proxy Routing

When running through Docker Compose, `depix-nginx` serves traffic on `http://localhost:${NGINX_PORT:-80}`:

| Route Pattern | Target | Behavior / Notes |
|---|---|---|
| `GET /health` | Nginx Inline | Returns `200 OK` (`text/plain`) |
| `/blog/static/*` | `blog_static` volume (`/var/www/blog/staticfiles/`) | Served directly by Nginx with 30-day cache headers |
| `/blog/media/*` | `blog_media` volume (`/var/www/blog/media/`) | Served directly by Nginx with 7-day cache headers |
| `/blog` | Redirect (`301`) | Redirects to `/blog/` |
| `/blog/*` | `blog:8000` (`proxy_pass http://blog_backend/`) | Strips `/blog/` prefix before Daphne while Django uses `FORCE_SCRIPT_NAME=/blog` |
| `/api/medusa/*` | `medusa:9000` (`proxy_pass http://medusa_backend/`) | Strips `/api/medusa/` prefix for Store & Admin Medusa APIs |
| `/` | `medusa:9000` (`proxy_pass http://medusa_backend`) | Default fallback route to Medusa backend |

---

## API Documentation & Endpoints

### Blog Endpoints (via Nginx at `/blog/`)
- **Health Checks**:
  - `GET /blog/health/cache` (or `http://localhost:8000/health/cache`)
  - `GET /blog/health/redis` (or `http://localhost:8000/health/redis`)
  - `GET /blog/health/cache-manager` (or `http://localhost:8000/health/cache-manager`)
- **API & Schema**:
  - `GET /blog/api/articles/` — Public articles API
  - `GET /blog/api/schema/` — OpenAPI schema
  - `GET /blog/api/schema/swagger-ui/` — Interactive Swagger UI (configured to load `/blog/api/schema/`)
  - `GET /blog/api/schema/redoc/` — ReDoc UI
- **Admin Panel**:
  - `GET /blog/admin/` — Django Unfold Admin

### Medusa Store & Payment Endpoints (via Nginx at `/api/medusa/` or direct `:9000`)
- `GET /api/medusa/health` — Medusa health check
- `GET /api/medusa/openapi.json` — OpenAPI v3 specification
- `GET /api/medusa/store/products`, `/store/products/:id`, `/store/products/:id/json-ld`, `/store/products/:id/videos`
- `POST /api/medusa/store/carts`, `/store/payments/initiate`, `GET`/`POST /api/medusa/payment/callback`, `POST /api/medusa/store/payments/verify`
- `GET /api/medusa/store/wishlist`, `/store/comparison`, `/store/notifications`

---

## Database, Redis & Persistent Storage

### PostgreSQL 16 Logical Isolation
- **Medusa**: Connects to database `depix_db` as `postgres` (default).
- **Blog**: Connects to database `blog_db` as `blog_user` (`NOSUPERUSER NOCREATEDB NOCREATEROLE`), owning only `blog_db` and its `public` schema. `blog_user` has no permissions on `depix_db`.
- **`db-init` Service**: Runs [`infrastructure/postgres/init-databases.sh`](file:///home/amir/github-projects/depix-ecommerce/infrastructure/postgres/init-databases.sh) on every `docker compose up -d` and is also mounted into `/docker-entrypoint-initdb.d/01-init-databases.sh` for fresh volumes, ensuring existing PostgreSQL data volumes are upgraded safely without data loss.

### Redis 7 Logical DB Isolation
Both applications share `depix-redis` (`redis://redis:6379`) using separate Redis logical databases:

| Redis DB | Owner | Purpose |
|---|---|---|
| `DB 0` | Blog | Celery task broker/result backend & Django Channels layer (`REDIS_URL=redis://redis:6379`) |
| `DB 1` | Blog | Django cache (`CACHES` automatically appends `/1` in `Blog/blog/settings.py`) |
| `DB 2` | Medusa | Medusa Express session store & Redis integrations (`REDIS_URL=redis://redis:6379/2`) |

### Persistent Volumes

| Volume Name | Mounted Path(s) | Purpose |
|---|---|---|
| `postgres_data` | `postgres:/var/lib/postgresql/data` | Persistent PostgreSQL 16 data (`depix_db` & `blog_db`) |
| `redis_data` | `redis:/data` | Persistent Redis 7 state |
| `medusa_uploads` | `medusa:/app/static` | Medusa static assets |
| `medusa_media_uploads` | `medusa:/app/uploads` | Medusa media & ticket attachment uploads |
| `blog_static` | `blog:/app/staticfiles`, `nginx:/var/www/blog/staticfiles:ro` | Collected Django static files |
| `blog_media` | `blog*:/app/media`, `nginx:/var/www/blog/media:ro` | Blog public media uploads |
| `blog_private_media` | `blog:/app/private_media`, `blog-celery-worker:/app/private_media` | Blog protected media storage |
| `blog_backups` | `blog*:/app/backups` | Blog BDR backup archives & manifests |
| `blog_logs` | `blog*:/app/logs` | Blog application & error logs |
| `blog_celerybeat` | `blog-celery-beat:/app/celerybeat` | Celery Beat schedule database (`celerybeat-schedule`) |

---

## Independent Development Workflows

Both projects retain full independent development capability:

### Medusa Local Development
```bash
cd medusa
corepack enable
yarn install
yarn start
```

### Blog Submodule Standalone Development
- **Local Python virtualenv**:
  ```bash
  cd Blog
  cp .env.example .env
  python manage.py migrate
  python manage.py runserver
  ```
- **Standalone Blog Docker Compose** (`Blog/docker-compose.yml`):
  `Blog/docker-compose.yml` defaults to host port `80` for its own Nginx container. If running the standalone `Blog/` stack while the root stack is also running, either stop the root stack (`docker compose down`) first or override `NGINX_PORT` in the root `.env` (e.g., `NGINX_PORT=8080`), and ensure `Blog/.env` exists (`cp Blog/.env.example Blog/.env`).

---

## Updating the Blog Submodule

Because `Blog/` is tracked as a Git submodule, updates are pulled explicitly and pinned in the root repository:

```bash
# 1. Fetch and update Blog to the latest commit on its tracked branch
git submodule update --remote Blog

# 2. Rebuild the Blog container image and recreate affected services
docker compose build blog
docker compose up -d

# 3. Verify health and schema/migrations
docker compose ps -a
docker compose logs --tail=30 blog

# 4. Commit the updated submodule pointer in the root repository
git add Blog
git commit -m "chore(submodule): update Blog submodule"
```

---

## Testing & Quality Assurance

### Root Stack Health Checks
```bash
curl -f http://localhost/health
curl -f http://localhost/api/medusa/health
curl -f http://localhost/blog/health/cache
curl -f http://localhost/blog/health/redis
docker exec depix-blog python manage.py check
docker exec depix-blog-celery-worker celery -A blog inspect ping
```

### Medusa Workspace Tests
```bash
cd medusa
yarn lint
yarn lint:medusa
yarn test
yarn test:integration:http
```

---

## Troubleshooting

1. **Blog Redis / Cache Failure (`invalid DB index` or connection error)**:
   Verify `BLOG_REDIS_URL` in root `.env` is `redis://redis:6379` **without** a trailing `/0` or `/1`. `Blog/blog/settings.py` appends `/1` directly to `REDIS_URL` for Django `CACHES`; adding `/0` produces an invalid `redis://redis:6379/0/1` URL.
2. **`blog_db` missing or `permission denied for schema public` on an existing `postgres_data` volume**:
   Docker's `/docker-entrypoint-initdb.d/` runs only on brand-new volumes. Run `docker compose up -d db-init` (or `docker compose up -d`) so `depix-db-init` executes [`infrastructure/postgres/init-databases.sh`](file:///home/amir/github-projects/depix-ecommerce/infrastructure/postgres/init-databases.sh) idempotently against the live PostgreSQL container.
3. **Port `80`, `8000`, `9000`, `5432`, or `6379` already in use**:
   Ensure `Blog/docker-compose.yml` or local services are not already bound to those ports, or override `NGINX_PORT`, `BLOG_PORT`, `MEDUSA_PORT`, `POSTGRES_PORT`, or `REDIS_PORT` in root `.env`.
4. **Blog static files returning 404 via Nginx**:
   Check `docker compose logs blog` to confirm `python manage.py collectstatic --no-input` completed and `blog_static` is mounted into both `depix-blog` (`/app/staticfiles`) and `depix-nginx` (`/var/www/blog/staticfiles:ro`).
5. **Celery worker or beat unhealthy**:
   Inspect logs via `docker compose logs blog-celery-worker blog-celery-beat` and verify queue consumption with `docker exec depix-blog-celery-worker celery -A blog inspect active_queues`.
6. **Django `DisallowedHost` or `403 CSRF verification failed` on custom domains**:
   Add your domain/origin to `BLOG_ALLOWED_HOSTS` and `BLOG_CSRF_TRUSTED_ORIGINS` in root `.env`, and update `DOMAIN` / `CORS_ALLOWED_ORIGINS` in `.env.blog`.

---

## Deployment Overview

- **Production Docker Strategy**: Root [`docker-compose.yml`](file:///home/amir/github-projects/depix-ecommerce/docker-compose.yml) orchestrates Node 22 Medusa, Python 3.12 Django/Daphne Blog + Celery Worker/Beat, PostgreSQL 16 Alpine, Redis 7 Alpine, and Nginx Alpine.
- **Production Hardening Checklist**:
  - Set `NODE_ENV=production`, `BLOG_DEBUG=False`, strong secrets (`MEDUSA_JWT_SECRET`, `MEDUSA_COOKIE_SECRET`, `SECRET_KEY`, `STATIC_API_KEY`, `POSTGRES_PASSWORD`, `BLOG_DB_PASSWORD`), and restrict `BLOG_ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` / `BLOG_CSRF_TRUSTED_ORIGINS` to production domains.
  - Terminate TLS/SSL (port `443`) at Nginx or an upstream load balancer and set `BLOG_SECURE_SSL_REDIRECT=True`, `BLOG_SESSION_COOKIE_SECURE=True`, and `BLOG_CSRF_COOKIE_SECURE=True`.
