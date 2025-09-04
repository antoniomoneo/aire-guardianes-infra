# Stage 1: build Vite app
FROM node:20 AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --include=dev || npm install --include=dev --legacy-peer-deps
COPY app/ .
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build --loglevel verbose || npm run build

# Stage 2: serve static files
FROM node:20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
EXPOSE 8080
CMD ["sh","-lc","set -eux; ls -la dist || true; echo PORT=$PORT; which serve; serve -s dist -l tcp://0.0.0.0:${PORT}"]
