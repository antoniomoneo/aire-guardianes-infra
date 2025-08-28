#!/usr/bin/env bash
set -euo pipefail

# Repo e ID de workflow (usa el fichero que ya tienes)
REPO_INFRA="${REPO_INFRA:-antoniomoneo/aire-guardianes-infra}"
WF_FILE="${WF_FILE:-.github/workflows/deploy-cloudrun.yml}"

# Versión: pasada como $1 o autogenerada vYYYY.MM.DD-HHMM
VERSION="${1:-v$(date +%Y.%m.%d-%H%M)}"

# Validación de formato (recomendado, pero no bloquea)
if [[ ! "$VERSION" =~ ^v[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[0-9]{4}$ && ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "⚠️  Formato de versión recomendado: vYYYY.MM.DD-HHMM o semver vX.Y.Z"
  echo "   Usando: $VERSION"
fi

echo "==> Preparando release $VERSION"

# Asegura estado limpio (omite con FORCE=1)
if [[ "${FORCE:-0}" != "1" ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "❌ Hay cambios sin commitear. Haz commit o exporta FORCE=1 para continuar igualmente."
    exit 1
  fi
fi

# Trae tags remotos y verifica existencia
git fetch --tags --quiet || true
if git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null; then
  echo "❌ El tag $VERSION ya existe. Elige otro, p.ej.: v$(date +%Y.%m.%d-%H%M)"
  exit 1
fi

# Crea y empuja tag
git tag -a "$VERSION" -m "release $VERSION"
git push origin "$VERSION"

echo "==> Tag $VERSION enviado. Esperando que GitHub registre el workflow…"
sleep 6

# Obtiene último run del workflow
RUN_ID="$(gh run list \
  --repo "$REPO_INFRA" \
  --workflow "$WF_FILE" \
  --limit 1 \
  --json databaseId -q '.[0].databaseId' || true)"

if [[ -z "${RUN_ID:-}" ]]; then
  echo "⚠️  No se pudo obtener RUN_ID aún."
  echo "    Consulta manualmente:"
  echo "      gh run list --repo $REPO_INFRA --workflow \"$WF_FILE\" --limit 3"
  exit 0
fi

echo "RUN_ID=$RUN_ID"
echo "==> Siguiendo ejecución…"
gh run watch "$RUN_ID" --repo "$REPO_INFRA" --exit-status || true

echo "----- Tail logs -----"
gh run view "$RUN_ID" --repo "$REPO_INFRA" --log | tail -n 150 || true

# Si existe el helper de URL, muéstralo al final
if [[ -x scripts/service-url.sh ]]; then
  echo "----- Service URL -----"
  scripts/service-url.sh || true
fi

echo "✅ Listo."
