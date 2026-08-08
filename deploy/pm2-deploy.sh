#!/usr/bin/env bash
# Déploiement VPS — git pull + build + PM2 (sans Docker)
# Usage : ./deploy/pm2-deploy.sh
#         ./deploy/pm2-deploy.sh --no-pull   (appelé par le hook post-merge)
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-}"
if [[ -z "$ENV_FILE" ]]; then
  if [[ -f .env.production ]]; then
    ENV_FILE=".env.production"
  elif [[ -f .env ]]; then
    ENV_FILE=".env"
  fi
fi

if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  echo "==> Variables : ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "ERREUR — Créez .env ou .env.production sur le serveur"
  exit 1
fi

export NODE_ENV=production
export PORT="${PORT:-3007}"

if [[ "${1:-}" != "--no-pull" ]]; then
  echo "==> git pull origin main"
  git pull origin main
fi

echo "==> npm ci"
npm ci

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> npm run build"
npm run build

echo "==> PM2 restart"
if pm2 describe louetonmatos >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "==> Health check"
sleep 3
if curl -sf "http://127.0.0.1:${PORT}/api/health/live" >/dev/null; then
  echo "OK — louetonmatos sur le port ${PORT}"
else
  echo "WARN — vérifiez : pm2 logs louetonmatos --lines 50"
fi
