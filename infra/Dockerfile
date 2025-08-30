# ---------- build (Vite) ----------
FROM node:20-alpine AS builder
WORKDIR /build

# Copiamos package.json y (si existe) package-lock.json
COPY app/package.json ./
# con esto no falla si falta:
COPY app/package-lock.json ./package-lock.json

# Instalar dependencias
# usamos fallback por si hay problemas de peer deps
RUN if [ -f package-lock.json ]; then \
      npm ci || npm install --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
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
