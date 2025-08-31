FROM node:20-alpine AS builder
WORKDIR /build
COPY app/package*.json ./
RUN npm ci || npm install --legacy-peer-deps
COPY app/ .
RUN npm run build

# --- Limpieza robusta del HTML generado (funciona 1 línea o multilínea) ---
#   - elimina <script type="importmap">...</script>
#   - elimina <link ... href="/index.css" ...>
RUN node -e "const fs=require('fs');const p='dist/index.html';let s=fs.readFileSync(p,'utf8');s=s.replace(/<script\\s+type=[\"']importmap[\"'][^>]*>[\\s\\S]*?<\\/script>/i,'');s=s.replace(/<link[^>]*href=[\"']\\/index\\.css[\"'][^>]*>/i,'');fs.writeFileSync(p,s);"

# Si existe un index.css en la raíz del repo app, lo copiamos a dist (opcional)
RUN if [ -f index.css ]; then cp index.css dist/index.css; fi

# Inyecta un pequeño overlay de errores en dist/index.html para diagnosticar pantallas en negro
RUN node -e "const fs=require('fs');const p='dist/index.html';let s=fs.readFileSync(p,'utf8');const inj=`\n<script>\n(function(){\n  function show(msg){\n    try{\n      const el=document.createElement('pre');\n      el.style.cssText='position:fixed;left:0;right:0;bottom:0;max-height:40%;overflow:auto;z-index:999999;background:#111;color:#f33;padding:8px;font:12px/1.4 monospace;white-space:pre-wrap;border-top:1px solid #333';\n      el.textContent=msg;\n      document.body.appendChild(el);\n    }catch(_){}\n  }\n  window.addEventListener('error', function(e){ show('[error] '+e.message+'\n'+(e.error&&e.error.stack||'')); });\n  window.addEventListener('unhandledrejection', function(e){ show('[unhandledrejection] '+(e.reason&&e.reason.message||e.reason)); });\n})();\n</script>\n`;\nif(!/unhandledrejection/.test(s)){ s=s.replace(/<\\/head>/i, inj+'\\n</head>'); fs.writeFileSync(p,s);}\n}" 

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
