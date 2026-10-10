#!/bin/sh
# =============================================================================
#  BILC - восстановление БД из дампа.
#
#  Использование (из корня проекта):
#    sh docker/scripts/restore.sh backups/bilc-20261009T120000Z.sql
#
#  ВНИМАНИЕ: операция ПЕРЕЗАПИСЫВАЕТ данные в указанных таблицах.
#  Восстановление выполняется от root, потому что дамп содержит DDL
#  (DROP TABLE / CREATE TABLE), а у роли приложения прав на схему нет.
# =============================================================================
set -eu

CONTAINER="${BILC_DB_CONTAINER:-bilc-db}"
FILE="${1:?укажите путь к .sql-дампу: sh docker/scripts/restore.sh <файл>}"

[ -f "$FILE" ] || { echo "[restore] файл не найден: $FILE" >&2; exit 1; }

# Проверка контрольной суммы, если она есть рядом с дампом.
if [ -f "${FILE}.sha256" ]; then
  echo "[restore] проверяю контрольную сумму"
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$(dirname "$FILE")" && sha256sum -c "$(basename "${FILE}.sha256")")
  fi
fi

echo "[restore] восстанавливаю ${FILE} в контейнер ${CONTAINER}"
docker exec -i "$CONTAINER" sh -c \
  'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "$FILE" 2>/dev/null

echo "[restore] готово. Проверьте целостность:"
echo "  sh docker/scripts/verify.sh"
