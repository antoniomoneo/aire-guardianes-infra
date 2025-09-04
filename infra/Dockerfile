FROM node:20-alpine AS builder
WORKDIR /build
# Ensure devDependencies are installed for build tools like Vite
ENV NPM_CONFIG_PRODUCTION=false
# Install dependencies using only manifests for better caching
COPY app/package*.json ./
RUN npm ci --include=dev || npm install --include=dev --legacy-peer-deps
# Copy application source
COPY app/ .
# Build the app; keep verbose logs for debugging build issues
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build --loglevel verbose || npm run build

# Normaliza salida: si el proyecto genera build/, muévelo a dist/
RUN if [ -d build ]; then mv build dist; fi

# Verificación mínima del output
RUN if [ -d dist ]; then echo "dist ready"; else echo "No dist or build output found"; ls -la; exit 1; fi
RUN ls -la dist || true

FROM node:20-alpine
WORKDIR /app
COPY infra/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
RUN node -e "require('express'); console.log('express ok')"
# Use the app's own server.js for a single runtime entrypoint
COPY --from=builder /build/server.js ./server.js
COPY --from=builder /build/dist ./dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
