#!/bin/sh
# =============================================================================
#  BILC - E2E-проверка персистентности данных при пересоздании контейнера.
#
#  Проверяет пункт 7 требований: данные обязаны переживать пересоздание
#  контейнера (down + up), потому что хранятся в именованном volume,
#  а не в слое контейнера.
#
#  Использование (из корня проекта): sh docker/scripts/test-persistence.sh
# =============================================================================
set -eu

CONTAINER="${BILC_DB_CONTAINER:-bilc-db}"
MARKER_KEY="persistence_probe"
MARKER_VAL="probe-$(date -u +%Y%m%dT%H%M%SZ)"

run_sql() {
  # -h 127.0.0.1: сокет-подключение даёт хост 'localhost', не покрытый 'user'@'%'.
  docker exec -i "$CONTAINER" sh -c \
    'exec mysql -h127.0.0.1 -u"$APP_DB_USER" -p"$APP_DB_PASSWORD" -D "$MYSQL_DATABASE" -N -B' 2>/dev/null
}

echo "=== 1. Записываю маркер в БД ==="
echo "INSERT INTO siteSettings (\`key\`, value) VALUES ('${MARKER_KEY}', '${MARKER_VAL}')
      ON DUPLICATE KEY UPDATE value = '${MARKER_VAL}';" | run_sql
echo "    маркер: ${MARKER_KEY} = ${MARKER_VAL}"

echo ""
echo "=== 2. Пересоздаю контейнер (volume сохраняется) ==="
docker compose down 2>&1 | grep -Ei 'removed|stopped' || true
docker compose up -d db 2>&1 | grep -Ei 'started|created' || true

echo ""
echo "=== 3. Жду healthy ==="
for i in $(seq 1 36); do
  sleep 5
  st=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo unknown)
  [ "$st" = "healthy" ] && { echo "    healthy через ~$((i*5)) c"; break; }
done

echo ""
echo "=== 4. Читаю маркер после пересоздания ==="
FOUND=$(echo "SELECT value FROM siteSettings WHERE \`key\` = '${MARKER_KEY}';" | run_sql)

if [ "$FOUND" = "$MARKER_VAL" ]; then
  echo "    ✅ ДАННЫЕ СОХРАНЕНЫ: ${FOUND}"
else
  echo "    ❌ ДАННЫЕ ПОТЕРЯНЫ: ожидалось '${MARKER_VAL}', получено '${FOUND}'" >&2
  exit 1
fi

echo ""
echo "=== 5. Убираю маркер ==="
echo "DELETE FROM siteSettings WHERE \`key\` = '${MARKER_KEY}';" | run_sql
echo "    готово"

echo ""
echo "ИТОГ: персистентность подтверждена — данные выжили полное пересоздание контейнера."
