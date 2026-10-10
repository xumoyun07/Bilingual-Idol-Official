#!/bin/sh
# =============================================================================
#  BILC - создание пользователей БД с минимальными привилегиями (least privilege)
#
#  Выполняется docker-entrypoint-initdb.d при первой инициализации volume.
#  Пароли приходят из переменных окружения контейнера, в SQL-файл не попадают.
#
#  MYSQL_USER в compose НАМЕРЕННО не задан: официальный образ MySQL выдаёт
#  такому пользователю ALL PRIVILEGES на базу. Здесь права выдаются явно.
# =============================================================================
set -eu

: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}"
: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"

APP_DB_USER="${APP_DB_USER:-bilc_app}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}"

READONLY_DB_USER="${READONLY_DB_USER:-bilc_readonly}"
READONLY_DB_PASSWORD="${READONLY_DB_PASSWORD:?READONLY_DB_PASSWORD is required}"

BACKUP_DB_USER="${BACKUP_DB_USER:-bilc_backup}"
BACKUP_DB_PASSWORD="${BACKUP_DB_PASSWORD:?BACKUP_DB_PASSWORD is required}"

echo "[initdb] создаю пользователей БД с минимальными правами (база: ${MYSQL_DATABASE})"

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
	-- Приложение: только DML. Никакого DDL/DROP/ALTER — принцип наименьших привилегий.
	-- Снижает ущерб при успешной SQL-инъекции: изменить схему она не сможет.
	CREATE USER IF NOT EXISTS '${APP_DB_USER}'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
	REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${APP_DB_USER}'@'%';
	GRANT SELECT, INSERT, UPDATE, DELETE ON \`${MYSQL_DATABASE}\`.* TO '${APP_DB_USER}'@'%';

	-- Read-only: аналитика, выгрузки, проверка целостности после бэкапа.
	CREATE USER IF NOT EXISTS '${READONLY_DB_USER}'@'%' IDENTIFIED BY '${READONLY_DB_PASSWORD}';
	REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${READONLY_DB_USER}'@'%';
	GRANT SELECT ON \`${MYSQL_DATABASE}\`.* TO '${READONLY_DB_USER}'@'%';

	-- Бэкап: минимальный набор, нужный mysqldump для консистентного снимка.
	-- DROP/ALTER не выдаются — восстановление делает отдельная роль администратора.
	CREATE USER IF NOT EXISTS '${BACKUP_DB_USER}'@'%' IDENTIFIED BY '${BACKUP_DB_PASSWORD}';
	REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${BACKUP_DB_USER}'@'%';
	GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON \`${MYSQL_DATABASE}\`.* TO '${BACKUP_DB_USER}'@'%';

	FLUSH PRIVILEGES;
EOSQL

echo "[initdb] пользователи созданы: ${APP_DB_USER} (DML), ${READONLY_DB_USER} (SELECT), ${BACKUP_DB_USER} (dump)"
