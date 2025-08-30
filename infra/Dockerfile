# ---------- build (Vite) ----------
FROM node:20-alpine AS builder
WORKDIR /build
COPY app/package*.json ./
RUN npm ci
COPY app/ .
RUN npm run build   # genera /build/dist

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
COPY infra/server.js ./server.js
COPY --from=builder /build/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
