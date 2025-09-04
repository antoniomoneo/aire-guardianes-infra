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

# --- Limpieza robusta del HTML generado (funciona 1 línea o multilínea) ---
#   - elimina <script type="importmap">...</script>
#   - elimina <link ... href="/index.css" ...>
RUN if [ -d build ]; then mv build dist; fi \
 && node -e "const fs=require('fs');const p='dist/index.html';let s=fs.readFileSync(p,'utf8');s=s.replace(/<script\\s+type=[\"']importmap[\"'][^>]*>[\\s\\S]*?<\\/script>/i,'');s=s.replace(/<link[^>]*href=[\"']\\/index\\.css[\"'][^>]*>/i,'');fs.writeFileSync(p,s);"

# Si existe un index.css en la raíz del repo app, lo copiamos a dist (opcional)
RUN if [ -f index.css ]; then cp index.css dist/index.css; fi

# Ensure a unified output directory exists
RUN if [ -d dist ]; then echo "dist ready"; else echo "No dist or build output found"; ls -la; exit 1; fi

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
