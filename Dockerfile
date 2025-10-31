# syntax=docker/dockerfile:1

# ---- Base build stage ----
FROM oven/bun:1 AS base
WORKDIR /app

# Copy backend dependencies (root-level package.json + bun.lock)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- Build frontend ----
COPY frontend ./frontend
WORKDIR /app/frontend
RUN bun install --frozen-lockfile
RUN bun run build

# ---- Copy backend code and move frontend build to public ----
WORKDIR /app
COPY server ./server
RUN mkdir -p server/public && cp -r frontend/dist/* server/public/

# ---- Runtime stage ----
FROM oven/bun:1 AS runtime
WORKDIR /app

# Copy everything from base
COPY --from=base /app /app

ENV NODE_ENV=production
EXPOSE 3000

# Start Bun + Hono server
CMD ["bun", "run", "server/index.ts"]