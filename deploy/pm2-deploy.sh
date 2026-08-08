#!/usr/bin/env bash
# Déploiement VPS — git pull + build + PM2 (sans Docker)
# Usage : ./deploy/pm2-deploy.sh
#         ./deploy/pm2-deploy.sh --no-pull   (appelé par le hook post-merge)
set -euo pipefail

cd "$(dirname "$0")/.."

load_env_file() {
  local file="$1"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local val="${BASH_REMATCH[2]}"
      if [[ "$val" =~ ^\"(.*)\"$ ]]; then
        val="${BASH_REMATCH[1]}"
      elif [[ "$val" =~ ^\'(.*)\'$ ]]; then
        val="${BASH_REMATCH[1]}"
      fi
      export "$key=$val"
    fi
  done < "$file"
}

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
  load_env_file "$ENV_FILE"
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
