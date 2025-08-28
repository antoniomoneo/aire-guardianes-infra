#!/usr/bin/env bash
set -euo pipefail
PROJECT_ID="${PROJECT_ID:-aire-470107}"
REGION="${REGION:-us-west1}"
SERVICE="${SERVICE:-aire-guardianes}"

gcloud run services describe "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)'
