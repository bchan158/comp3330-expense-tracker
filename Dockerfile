# syntax=docker/dockerfile:1

# ---- Base build stage ----
FROM oven/bun:1 AS base
WORKDIR /app

# Copy and install backend dependencies
COPY server/package.json server/bun.lock ./server/
WORKDIR /app/server
RUN bun install --frozen-lockfile

# ---- Build frontend ----
WORKDIR /app
COPY frontend ./frontend
RUN cd frontend && bun install --frozen-lockfile
RUN cd frontend && bun run build

# ---- Copy built frontend into backend public folder ----
RUN mkdir -p server/public && cp -r frontend/dist/* server/public/

# ---- Runtime image ----
FROM oven/bun:1 AS runtime
WORKDIR /app

# Copy everything from the build stage
COPY --from=base /app /app

ENV NODE_ENV=production
EXPOSE 3000

# ✅ Start your Bun + Hono server
CMD ["bun", "run", "server/index.ts"]