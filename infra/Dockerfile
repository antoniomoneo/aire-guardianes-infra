# ===== Build (Debian slim para evitar problemas de binarios) =====
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Dependencias de compilación por si algún paquete usa node-gyp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates git \
 && rm -rf /var/lib/apt/lists/*

# Copiamos manifests DESDE la carpeta app/ (el workflow clona la app en ./app)
COPY app/package*.json ./
# Si hay lockfile => npm ci; si no => npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Código de la app
COPY app/ .

# Asegura que existe el build script y el plugin de react
# (no falla si ya están)
RUN node -e "const p=require('./package.json'); if(!p.scripts||!p.scripts.build){process.exit(1)}" \
 || (echo 'Falta el script "build" en package.json' && exit 1)

# Construye Vite
RUN npm run build

# ===== Runtime (Debian slim) =====
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo deps de producción
COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Servidor Express y estáticos
COPY app/server.js ./server.js
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server.js"]
