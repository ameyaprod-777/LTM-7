#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file ${ENV_FILE}"

echo "==> Pull latest code"
git pull origin main

echo "==> Build app image"
$COMPOSE build app

echo "==> Apply database migrations"
$COMPOSE run --rm app npx prisma migrate deploy

echo "==> Restart app"
$COMPOSE up -d app

echo "==> Health check"
sleep 5
if curl -sf "http://127.0.0.1:3000/api/health" >/dev/null; then
  echo "OK — /api/health répond"
  curl -s "http://127.0.0.1:3000/api/health" | head -c 500
  echo ""
else
  echo "WARN — /api/health ne répond pas encore (vérifiez les logs)"
fi

echo "==> Done. Logs:"
$COMPOSE logs -f app --tail=30
