# Depix E-commerce Workspace

Welcome to the **Depix E-commerce** workspace repository. This monorepo workspace integrates Medusa backend and Payload CMS into a unified monorepo infrastructure.

## Architecture & Project Overview

```text
                    ┌──────────────┐
                    │    Nginx     │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼─────┐             ┌─────▼─────┐
        │  Medusa   │             │  Payload  │
        │ Backend   │             │ Backend   │
        └─────┬─────┘             └─────┬─────┘
              │                         │
              └────────────┬────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    └─────────────┘

                    ┌─────────────┐
                    │    Redis    │
                    └─────────────┘
```

- **Medusa (`medusa/`)**: Operates as the core E-commerce Backend engine (Order management, Products, Cart, Customer accounts). Uses Yarn package manager.
- **Payload (`payload/`)**: Operates as the Content Backend / CMS / Admin interface. Uses PNPM package manager.
- **Central Infrastructure (`infrastructure/`)**: Holds shared Docker configurations, Nginx reverse proxy routes, scripts, and general workspace configurations.

## Workspace Directory Structure

```text
depix-ecommerce/
├── medusa/                  # Medusa e-commerce backend repository
├── payload/                 # Payload CMS repository
├── infrastructure/          # Shared central infrastructure
│   ├── docker/              # Docker resources and custom Dockerfiles
│   ├── nginx/               # Nginx reverse proxy configuration (nginx.conf)
│   ├── scripts/             # Infrastructure management scripts
│   └── config/              # Shared workspace configuration files
├── docker-compose.yml       # Centralized orchestration for local development
├── .env.example             # Template for workspace environment variables
├── .gitignore               # Root git ignore rules
└── README.md                # Project documentation
```

## Getting Started & Local Development

### 1. Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (v20+)
- Corepack enabled (`corepack enable`) for yarn/pnpm support.

### 2. Environment Setup
Copy the `.env.example` file to create your local `.env` configuration:

```bash
cp .env.example .env
```

> **Security Note:** Never commit actual secrets, API keys, or database passwords to Git. Ensure `.env` remains ignored by Git.

### 3. Running Services with Docker Compose

Start the full stack (PostgreSQL, Redis, Medusa, Payload, Nginx):

```bash
docker compose up -d
```

Check logs for running services:

```bash
docker compose logs -f
```

Stop services:

```bash
docker compose down
```

## Service Endpoints (via Nginx Reverse Proxy)

When running through Docker Compose, Nginx proxies requests on port `80`:

- **Nginx Reverse Proxy**: `http://localhost:80`
- **Payload CMS**: `http://localhost:80/payload/`
- **Medusa Backend API**: `http://localhost:80/api/medusa/`
