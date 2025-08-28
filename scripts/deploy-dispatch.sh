#!/usr/bin/env bash
set -euo pipefail

REPO_INFRA="${REPO_INFRA:-antoniomoneo/aire-guardianes-infra}"
WF_FILE="${WF_FILE:-.github/workflows/deploy-cloudrun.yml}"

VERSION="${1:-v$(date +%Y.%m.%d-%H%M)}"

echo "==> Disparando workflow ${WF_FILE} con version=${VERSION}"
gh workflow run "${WF_FILE}" --repo "${REPO_INFRA}" -f version="${VERSION}"

echo "==> Obteniendo último RUN_ID…"
RUN_ID="$(gh run list --repo "${REPO_INFRA}" --workflow "${WF_FILE}" --limit 1 --json databaseId -q '.[0].databaseId' || true)"
echo "RUN_ID=${RUN_ID:-}"

if [[ -n "${RUN_ID:-}" ]]; then
  echo "==> Siguiendo ejecución hasta terminar…"
  gh run watch "$RUN_ID" --repo "${REPO_INFRA}" --exit-status
  echo "==> Tail de logs:"
  gh run view  "$RUN_ID" --repo "${REPO_INFRA}" --log | tail -n 120
else
  echo "No se pudo obtener RUN_ID aún. Consulta:"
  echo "  gh run list --repo ${REPO_INFRA} --workflow \"${WF_FILE}\" --limit 3"
fi
