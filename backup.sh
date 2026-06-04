#!/bin/bash
# Backup Script for Elevora AI Database & Assets
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="${BACKUP_DIR}/elevora_db_${TIMESTAMP}.sql"
ASSETS_BACKUP_FILE="${BACKUP_DIR}/elevora_assets_${TIMESTAMP}.tar.gz"

echo "=== Starting Backup Process: ${TIMESTAMP} ==="

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# 1. Load Environment Settings
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "ERROR: .env file missing. Cannot run backup."
    exit 1
fi

# 2. Database Backup (MySQL inside Docker)
echo "--- Backing up MySQL Database ---"
docker exec elevora-mysql-prod mysqldump -u"${DB_USERNAME:-elevora_app}" -p"${DB_PASSWORD}" "${DB_NAME:-elevora_ai}" > "${DB_BACKUP_FILE}"
gzip "${DB_BACKUP_FILE}"
echo "Database backup saved to: ${DB_BACKUP_FILE}.gz"

# 3. MinIO Assets Backup (Volume snapshot mapping)
echo "--- Backing up MinIO Object Assets ---"
docker run --rm --volumes-from elevora-minio-prod -v $(pwd)/${BACKUP_DIR}:/backup alpine tar czf /backup/elevora_assets_${TIMESTAMP}.tar.gz /data
echo "Assets backup saved to: ${ASSETS_BACKUP_FILE}"

# 4. Cleanup old backups (Keep last 30 days)
echo "--- Cleaning up backups older than 30 days ---"
find "${BACKUP_DIR}" -type f -mtime +30 -name "elevora_*" -delete

echo "=== Backup Complete ==="
