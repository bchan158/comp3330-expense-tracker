# syntax=docker/dockerfile:1

# ---- Base build stage ----
FROM oven/bun:1 AS base
WORKDIR /app

# Copy backend dependencies and root lockfile
COPY server/package.json bun.lock ./server/
WORKDIR /app/server
RUN bun install --frozen-lockfile

# ---- Build frontend ----
WORKDIR /app
COPY frontend ./frontend
RUN cd frontend && bun install --frozen-lockfile
RUN cd frontend && bun run build

# ---- Copy backend code and built frontend to public ----
COPY server ./server
RUN mkdir -p server/public && cp -r frontend/dist/* server/public/

# ---- Runtime stage ----
FROM oven/bun:1 AS runtime
WORKDIR /app
COPY --from=base /app /app

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "server/index.ts"]