FROM node:20-alpine AS builder
WORKDIR /app

# Copiamos el código fuente desde GitHub
RUN apk add --no-cache git
RUN git clone https://github.com/antoniomoneo/AIRE---Guardianes-del-Aire.git app
WORKDIR /app/app

# Instalamos dependencias y construimos
RUN npm install
RUN npm run build

# Servidor estático
FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/app/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
