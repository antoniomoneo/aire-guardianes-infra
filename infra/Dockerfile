# Stage 1: build Vite app
FROM node:20 AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --include=dev || npm install --include=dev --legacy-peer-deps
COPY app/ .
ENV NODE_OPTIONS=--openssl-legacy-provider
# Strip dev-only importmap and stray index.css link to avoid Vite/Rollup unresolved externals
RUN node -e "const fs=require('fs');let s=fs.readFileSync('index.html','utf8');s=s.replace(/<script\\s+type=[\"']importmap[\"'][^>]*>[\\s\\S]*?<\\/script>\\s*/i,'');s=s.replace(/<link[^>]*href=[\"']\\/index\\.css[\"'][^>]*>\\s*/i,'');fs.writeFileSync('index.html',s);"
RUN npm run build --loglevel verbose || (echo '--- Vite build failed; dumping npm debug logs ---' && ls -la /root/.npm/_logs || true && find /root/.npm/_logs -type f -name "*-debug-*.log" -exec sh -lc 'echo ==== {} ====; sed -n '"'1,200p'"' {}' \; ; exit 1)

# Stage 2: serve static files
FROM node:20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
EXPOSE 8080
CMD ["sh","-lc","set -eux; ls -la dist || true; echo PORT=$PORT; which serve; serve -s dist -l tcp://0.0.0.0:${PORT}"]
