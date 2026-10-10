#!/bin/sh
# =============================================================================
#  BILC - резервное копирование БД из контейнера.
#
#  Использование (из корня проекта):
#    sh docker/scripts/backup.sh [каталог]
#    по умолчанию каталог: ./backups
#
#  Дамп снимается ролью bilc_backup (SELECT, LOCK TABLES, SHOW VIEW, EVENT,
#  TRIGGER) — прав на изменение схемы у неё нет.
# =============================================================================
set -eu

CONTAINER="${BILC_DB_CONTAINER:-bilc-db}"
OUT_DIR="${1:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT_DIR"
FILE="${OUT_DIR}/bilc-${STAMP}.sql"

echo "[backup] снимаю дамп с контейнера ${CONTAINER}"

# --single-transaction: консистентный снимок InnoDB без блокировки таблиц
#                       (требование ACID-совместимого бэкапа под нагрузкой).
# --routines --triggers --events: сохраняем всё, что относится к схеме.
# -h 127.0.0.1 обязателен: роли созданы как 'user'@'%', а сокет-подключение
# даёт хост 'localhost', который под '%' не подпадает.
docker exec "$CONTAINER" sh -c \
  'exec mysqldump -h127.0.0.1 -u"$BACKUP_DB_USER" -p"$BACKUP_DB_PASSWORD" \
     --single-transaction --routines --triggers --events \
     --set-gtid-purged=OFF "$MYSQL_DATABASE"' \
  > "$FILE" 2>/dev/null

if [ ! -s "$FILE" ]; then
  echo "[backup] ОШИБКА: дамп пуст, файл удалён" >&2
  rm -f "$FILE"
  exit 1
fi

# Контрольная сумма — для проверки целостности при восстановлении.
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$FILE" > "${FILE}.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$FILE" > "${FILE}.sha256"
fi

echo "[backup] готово: ${FILE} ($(wc -c < "$FILE") байт)"
echo "[backup] не забудьте скопировать дамп ЗА ПРЕДЕЛЫ этого хоста —"
echo "         volume защищает от перезапуска, но не от потери диска."
