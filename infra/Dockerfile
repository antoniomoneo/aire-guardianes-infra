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
# Create a dedicated build config to externalize Node-only deps if encountered (use heredoc to avoid backtick parsing)
RUN cat > vite.build.config.ts <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  publicDir: 'media',
  build: {
    rollupOptions: {
      external: ['express','path','node:path','url','node:url','vite','@vitejs/plugin-react'],
      onwarn(warning, defaultHandler) {
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        defaultHandler(warning);
      }
    }
  }
});
EOF
RUN npm run build --loglevel verbose -- --config vite.build.config.ts || npm run build -- --config vite.build.config.ts

# Normaliza salida: si el proyecto genera build/, muévelo a dist/
RUN if [ -d build ]; then mv build dist; fi

# Verificación mínima del output
RUN if [ -d dist ]; then echo "dist ready"; else echo "No dist or build output found"; ls -la; exit 1; fi
RUN ls -la dist || true

FROM node:20-slim
WORKDIR /app
COPY infra/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
RUN node -e "require('express'); console.log('express ok')"
# Use the app's own server.js for a single runtime entrypoint
COPY --from=builder /build/server.js ./server.js
COPY --from=builder /build/dist ./dist
# Lightweight ESM entrypoint to log boot details and start the server
RUN cat > run.mjs <<'EOF'
import fs from 'node:fs';
const port = process.env.PORT || '8080';
console.log(`[boot] PORT=${port}`);
try { console.log('[boot] cwd:', process.cwd()); } catch {}
try { console.log('[boot] files:', fs.readdirSync('.')); } catch {}
try { console.log('[boot] dist exists:', fs.existsSync('dist'), 'index:', fs.existsSync('dist/index.html')); } catch {}
import('./server.js').catch((e) => { console.error('[boot] failed to start server:', e); process.exit(1); });
EOF
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "run.mjs"]
