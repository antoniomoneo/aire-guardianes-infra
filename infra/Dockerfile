# ===== Build (Debian slim para evitar problemas de binarios) =====
FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates git \
 && rm -rf /var/lib/apt/lists/*

# Manifests desde ./app (el workflow clona la app en ./app)
COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Código de la app
COPY app/ .

# Diagnóstico y build con log detallado
RUN node -v && npm -v && ls -la && \
    npm config set loglevel verbose && \
    echo "== package.json ==" && cat package.json && \
    (test -f vite.config.ts && { echo "== vite.config.ts =="; cat vite.config.ts; } || true) && \
    npm run build

# ===== Runtime =====
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Servidor Express + estáticos ya construidos
COPY app/server.js ./server.js
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server.js"]
