#!/bin/sh
# =============================================================================
#  BILC - проверка состояния контейнерной БД.
#  Использование (из корня проекта): sh docker/scripts/verify.sh
# =============================================================================
set -eu

CONTAINER="${BILC_DB_CONTAINER:-bilc-db}"
SQL_FILE="$(dirname "$0")/verify.sql"

echo "[verify] контейнер: ${CONTAINER}"
docker compose ps db

echo ""
echo "[verify] healthcheck: $(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER")"

echo ""
docker exec -i "$CONTAINER" sh -c \
  'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -D "$MYSQL_DATABASE" --table' \
  < "$SQL_FILE" 2>/dev/null

echo ""
echo "[verify] права ролей:"
for role in "${APP_DB_USER:-bilc_app}" "${READONLY_DB_USER:-bilc_readonly}" "${BACKUP_DB_USER:-bilc_backup}"; do
  docker exec -i "$CONTAINER" sh -c \
    "exec mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -N -B -e \"SHOW GRANTS FOR '${role}'@'%'\"" 2>/dev/null \
    | sed "s/^/  ${role}: /"
done
