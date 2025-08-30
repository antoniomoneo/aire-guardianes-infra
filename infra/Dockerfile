# ---------- build (Vite) ----------
FROM node:20-alpine AS builder
WORKDIR /build

# Manifiestos de la app y deps para build
COPY app/package*.json ./
RUN npm ci || npm install --legacy-peer-deps

# Código de la app y build
COPY app/ .
RUN npm run build   # genera /build/dist

# ---------- runtime (server Express) ----------
FROM node:20-alpine
WORKDIR /app

# Instalar deps del servidor (express) declaradas en infra/package.json
COPY infra/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
# Verificación en build: debe imprimir "express ok"
RUN node -e "require('express'); console.log('express ok')"

# Copiar servidor y estáticos compilados
COPY infra/server.js ./server.js
COPY --from=builder /build/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
