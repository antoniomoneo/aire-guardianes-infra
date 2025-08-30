# ---------- build (Vite) ----------
FROM node:20-alpine AS builder
WORKDIR /build

# Copia manifest(s). El comodín funciona si existe solo package.json.
COPY app/package*.json ./

# (Opcional) toolchain por si hay dependencias nativas
# RUN apk add --no-cache python3 make g++

# Instala deps: usa lock si existe; si no, instala con fallback de peer deps
RUN if [ -f package-lock.json ]; then \
      npm ci || npm install --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Copia el resto del código y build
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
