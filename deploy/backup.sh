#!/usr/bin/env bash
# Backup PostgreSQL (Docker) vers /backup, rétention 14 jours.
# Usage : ./deploy/backup.sh [/chemin/backup]
# Cron quotidien recommandé :
#   0 3 * * * /opt/louetonmatos/deploy/backup.sh >> /var/log/ltm-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${1:-/backup}"
TIMESTAMP="$(date +%F_%H%M)"
FILE="${BACKUP_DIR}/ltm-${TIMESTAMP}.sql.gz"
CONTAINER="${POSTGRES_CONTAINER:-louetonmatos-db}"
DB_USER="${POSTGRES_USER:-louetonmatos}"
DB_NAME="${POSTGRES_DB:-louetonmatos}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Démarrage backup → ${FILE}"
docker exec "$CONTAINER" \
  pg_dump -U "$DB_USER" "$DB_NAME" \
  | gzip > "$FILE"

SIZE="$(du -h "$FILE" | cut -f1)"
echo "[$(date -Iseconds)] OK — ${SIZE}"

# Suppression des fichiers de plus de N jours
find "$BACKUP_DIR" -name "ltm-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
REMAINING="$(find "$BACKUP_DIR" -name "ltm-*.sql.gz" | wc -l | tr -d ' ')"
echo "[$(date -Iseconds)] Rétention ${RETENTION_DAYS}j — ${REMAINING} fichier(s) conservé(s)"
