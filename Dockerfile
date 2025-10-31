# syntax=docker/dockerfile:1

# ---- Base build stage ----
FROM oven/bun:1 AS base
WORKDIR /app

# Copy root-level package.json and bun.lock for backend
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- Build frontend ----
COPY frontend ./frontend
RUN cd frontend && bun install --frozen-lockfile
RUN cd frontend && bun run build

# ---- Copy backend code and move built frontend to public ----
COPY server ./server
RUN mkdir -p server/public && cp -r frontend/dist/* server/public/

# ---- Runtime stage ----
FROM oven/bun:1 AS runtime
WORKDIR /app
COPY --from=base /app /app

ENV NODE_ENV=production
EXPOSE 3000

# ✅ Start Bun + Hono server
CMD ["bun", "run", "server/index.ts"]