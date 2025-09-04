## AIRE Guardianes Infra

Resumen del flujo de build y runtime usado para desplegar la app Vite "AIRE---Guardianes-del-Aire" en Cloud Run.

### Arquitectura
- Repos separados: este repo contiene Infra; la app vive en `antoniomoneo/AIRE---Guardianes-del-Aire`.
- Cloud Build clona la app en `app/` (ver `cloudbuild.yaml`).
- `infra/Dockerfile` construye la app (Vite) a `dist/` y usa el `server.js` de la app como único entrypoint en runtime.
- La imagen resultante sirve contenido estático desde `/app/dist` y expone API mínimas (Gemini, GitHub) según `server.js` de la app.

### Secrets en Cloud Run
- `API_KEY` y `GEMINI_API_KEY`: mapeadas desde el mismo Secret `API_KEY`.
- `GITHUB_TOKEN`: opcional; requerido para operaciones de escritura en la galería.
- Se inyectan en el despliegue desde Cloud Build: ver `--set-secrets` en `cloudbuild.yaml`.

### Despliegue (Cloud Build)
1) Cloud Build clona la app:
   - `git clone https://github.com/antoniomoneo/AIRE---Guardianes-del-Aire.git app`
2) Construye la imagen con `infra/Dockerfile` y despliega a Cloud Run.
3) Asegúrate de tener los Secrets `API_KEY` y `GITHUB_TOKEN` creados en el proyecto.

### Desarrollo local
```bash
# Desde la raíz de este repo
git clone https://github.com/antoniomoneo/AIRE---Guardianes-del-Aire.git app
docker build -f infra/Dockerfile -t aire:local .
docker run -p 8080:8080 -e API_KEY=xxxxx -e GITHUB_TOKEN=yyyyy aire:local
# Abrir http://localhost:8080
```

### Notas
- El `Dockerfile` normaliza la salida del build a `dist/` y valida su existencia.
- `.dockerignore` excluye `node_modules`, `dist`, `build`, etc., para builds más rápidos y deterministas.
- Para cambiar la URL del repo de la app, edita `cloudbuild.yaml` (paso `git clone`).
