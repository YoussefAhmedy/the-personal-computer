# THE PERSONAL COMPUTER — backend image
# Multi-stage build: install dependencies in a full node image (so
# better-sqlite3's native module can compile if no prebuilt binary
# matches), then copy just the runtime artifacts into a slim image.
#
# Build this from the PROJECT ROOT (not from backend/), since it needs
# the frontend/ folder too — docker-compose.yml already does this:
#   docker compose up --build

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# Runs as a non-root user — no reason a personal photo archive needs
# root inside its own container.
RUN groupadd -r pcuser && useradd -r -g pcuser pcuser

COPY --from=deps /app/node_modules ./node_modules
COPY backend/. .
COPY frontend /frontend

RUN mkdir -p data uploads/images uploads/videos uploads/audio \
    && chown -R pcuser:pcuser /app /frontend

USER pcuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "node src/db/seed.js && node server.js"]
