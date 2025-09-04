FROM node:20-alpine AS builder
WORKDIR /build
# Ensure devDependencies are installed for build tools like Vite
ENV NPM_CONFIG_PRODUCTION=false
# Install dependencies using only manifests for better caching
COPY app/package*.json ./
RUN npm ci --include=dev || npm install --include=dev --legacy-peer-deps
# Copy application source
COPY app/ .
# Pre-build: remove importmap and stray index.css link from index.html to avoid bundling external/Node modules
RUN node -e "const fs=require('fs');let s=fs.readFileSync('index.html','utf8');s=s.replace(/<script\\s+type=[\"']importmap[\"'][^>]*>[\\s\\S]*?<\\/script>\\s*/i,'');s=s.replace(/<link[^>]*href=[\"']\\/index\\.css[\"'][^>]*>\\s*/i,'');fs.writeFileSync('index.html',s);"
# Build the app; keep verbose logs for debugging build issues
ENV NODE_OPTIONS=--openssl-legacy-provider
# Create a dedicated build config to externalize Node-only deps if encountered
RUN node -e "const fs=require('fs');fs.writeFileSync('vite.build.config.ts',`
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    publicDir: 'media',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN),
    },
    server: { port: 5173 },
    build: {
      rollupOptions: {
        external: ['express','path','node:path','url','node:url','vite','@vitejs/plugin-react'],
        onwarn(warning, defaultHandler) {
          if (warning.code === 'UNRESOLVED_IMPORT') return; // ignore unresolved imports (externalized)
          defaultHandler(warning);
        }
      }
    }
  }
});
`);"
RUN npm run build --loglevel verbose -- --config vite.build.config.ts || npm run build -- --config vite.build.config.ts

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
