# --- Build (usa el repo/clonado en ./app) ---
FROM node:20-alpine AS builder
WORKDIR /app

# Manifests desde la carpeta app/
COPY app/package*.json ./

# Instala deps (con o sin lockfile)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copia todo el código de la app
COPY app/ .

# Build frontend (si no hay script build, intenta vite)
RUN npm run build || npx vite build

# --- Runtime (Nginx estático SPA en 8080) ---
FROM nginx:alpine
# Config SPA + cache para assets
RUN printf 'server {\n  listen 8080;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri /index.html;\n  }\n  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {\n    add_header Cache-Control "public, max-age=31536000, immutable";\n    try_files $uri =404;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx","-g","daemon off;"]
