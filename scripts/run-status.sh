#!/usr/bin/env bash
set -euo pipefail

REPO_INFRA="${REPO_INFRA:-antoniomoneo/aire-guardianes-infra}"
WF_FILE="${WF_FILE:-.github/workflows/deploy-cloudrun.yml}"

RUN_ID="$(gh run list --repo "${REPO_INFRA}" --workflow "${WF_FILE}" --limit 1 --json databaseId -q '.[0].databaseId' || true)"
echo "RUN_ID=${RUN_ID:-}"
[[ -z "${RUN_ID:-}" ]] && { echo "No hay runs."; exit 1; }

gh run view "$RUN_ID" --repo "${REPO_INFRA}" --json name,status,conclusion,createdAt,updatedAt,headBranch,headSha -q '.'
echo "----- Tail logs -----"
gh run view "$RUN_ID" --repo "${REPO_INFRA}" --log | tail -n 120
