# ---- Build (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app
# Copiamos la app (el workflow checkoutea la app en ./app del repo de infra)
COPY app/package*.json ./
RUN npm ci || npm install
COPY app/ .
RUN npm run build

# ---- Runtime (Express) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Solo deps de producción
COPY app/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
# Servidor y estáticos ya construidos
COPY app/server.js ./server.js
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "server.js"]
