# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare yarn@3.2.1 --activate

COPY . .

ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false
ENV YARN_ENABLE_GLOBAL_CACHE=true
ENV YARN_GLOBAL_FOLDER=/root/.yarn/berry
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN --mount=type=cache,target=/root/.yarn/berry/cache yarn install

RUN --mount=type=cache,target=/app/node_modules/.cache/turbo yarn turbo run build build:plugin \
    --filter=@medusajs/medusa... \
    --filter=@medusajs/cli... \
    --filter=@medusajs/draft-order... \
    --filter=@medusajs/wallet... \
    --filter=@medusajs/payment-wallet... \
    --filter=@medusajs/notification-sms... \
    --filter=@medusajs/brand... \
    --filter=@medusajs/invoice... \
    --filter=@medusajs/media... \
    --filter=@medusajs/price-alert... \
    --filter=@medusajs/ticket... \
    --filter=@medusajs/size-guide... \
    --filter=@medusajs/banner... \
    --no-daemon && \
    rm -rf /tmp/*

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
