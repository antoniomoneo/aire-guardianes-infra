# ---------- build (Vite) ----------
FROM node:20-alpine AS builder
WORKDIR /build

# Copiamos manifest y lock si existe
COPY app/package.json ./
COPY app/package-lock.json ./ 2>/dev/null || true

# Instala dependencias:
# - si hay lock -> npm ci
# - si no hay lock -> npm install (con fallback para peers)
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install || npm install --legacy-peer-deps; \
    fi

# Copiamos el resto del código y construimos
COPY app/ .
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
COPY infra/server.js ./server.js
COPY --from=builder /build/dist ./dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
