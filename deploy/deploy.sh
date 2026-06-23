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

echo "==> Done. Logs:"
$COMPOSE logs -f app --tail=30
