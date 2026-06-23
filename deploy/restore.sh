#!/usr/bin/env bash
# Restaure un backup PostgreSQL dans le conteneur Docker.
# Usage : ./deploy/restore.sh /backup/ltm-2026-06-23_0300.sql.gz
set -euo pipefail

FILE="${1:-}"
CONTAINER="${POSTGRES_CONTAINER:-louetonmatos-db}"
DB_USER="${POSTGRES_USER:-louetonmatos}"
DB_NAME="${POSTGRES_DB:-louetonmatos}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage : $0 /chemin/vers/ltm-YYYY-MM-DD_HHMM.sql.gz" >&2
  exit 1
fi

echo "[$(date -Iseconds)] Restauration depuis ${FILE} ..."
echo "[$(date -Iseconds)] ATTENTION : toutes les données actuelles seront écrasées."
read -r -p "Confirmer ? [oui/NON] " CONFIRM
[[ "$CONFIRM" == "oui" ]] || { echo "Annulé."; exit 0; }

gunzip -c "$FILE" | docker exec -i "$CONTAINER" \
  psql -U "$DB_USER" "$DB_NAME"

echo "[$(date -Iseconds)] Restauration terminée."
