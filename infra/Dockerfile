FROM node:20-alpine AS builder
WORKDIR /build
COPY app/package*.json ./
RUN npm ci || npm install --legacy-peer-deps
COPY app/ .
RUN npm run build

# quitar <script type="importmap">...</script> del dist/index.html
RUN awk 'BEGIN{del=0} /<script[[:space:]]+type="importmap">/{del=1} !del{print} /<\/script>/{if(del){del=0}}' dist/index.html > /tmp/idx && mv /tmp/idx dist/index.html
# quitar la línea que referencia /index.css (si existe)
RUN sed -i '/href="\/index\.css"/d' dist/index.html

# si tienes un index.css en raíz del repo de la app, cópialo para evitar 404 (opcional)
RUN if [ -f index.css ]; then cp index.css dist/index.css; fi

FROM node:20-alpine
WORKDIR /app
COPY infra/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
RUN node -e "require('express'); console.log('express ok')"
COPY infra/server.js ./server.js
COPY --from=builder /build/dist ./dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
