# Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
# Vite genera 'dist'
RUN npm run build

# Runtime
FROM node:20-alpine
RUN npm i -g serve
WORKDIR /app
# Copiamos la carpeta de salida de Vite
COPY --from=builder /app/dist ./dist
EXPOSE 8080
# -s = SPA fallback a index.html
CMD ["serve", "-s", "dist", "-l", "8080"]
