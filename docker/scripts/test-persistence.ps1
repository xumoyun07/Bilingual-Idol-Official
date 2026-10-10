# =============================================================================
#  BILC - E2E-проверка персистентности данных при пересоздании контейнера.
#  PowerShell-вариант для Windows. POSIX-аналог: docker/scripts/test-persistence.sh
#
#  Использование (из корня проекта): pwsh docker/scripts/test-persistence.ps1
# =============================================================================
$ErrorActionPreference = "Stop"
$container = if ($env:BILC_DB_CONTAINER) { $env:BILC_DB_CONTAINER } else { "bilc-db" }
$markerKey = "persistence_probe"
$markerVal = "probe-" + [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")

function Invoke-AppSql {
    param([string]$Sql)
    # -h127.0.0.1: роли созданы как 'user'@'%', сокет-подключение дало бы 'localhost'.
    $Sql | docker exec -i $container sh -c 'exec mysql -h127.0.0.1 -u"$APP_DB_USER" -p"$APP_DB_PASSWORD" -D "$MYSQL_DATABASE" -N -B' 2>$null
}

Write-Host "=== 1. Записываю маркер в БД ==="
Invoke-AppSql "INSERT INTO siteSettings (``key``, value) VALUES ('$markerKey', '$markerVal') ON DUPLICATE KEY UPDATE value='$markerVal';"
Write-Host "    маркер: $markerKey = $markerVal"

Write-Host "`n=== 2. Пересоздаю контейнер (volume сохраняется) ==="
docker compose down 2>&1 | Select-String -Pattern 'Removed|Stopped' | ForEach-Object { "    $_" }
docker compose up -d db 2>&1 | Select-String -Pattern 'Started|Created' | ForEach-Object { "    $_" }

Write-Host "`n=== 3. Жду healthy ==="
$healthy = $false
for ($i = 1; $i -le 36; $i++) {
    Start-Sleep -Seconds 5
    $st = docker inspect --format '{{.State.Health.Status}}' $container 2>$null
    if ($st -eq "healthy") { Write-Host "    healthy через ~$($i*5) c"; $healthy = $true; break }
}
if (-not $healthy) { Write-Host "    ❌ не стал healthy за 180 c" }

Write-Host "`n=== 4. Читаю маркер после пересоздания ==="
$found = (Invoke-AppSql "SELECT value FROM siteSettings WHERE ``key`` = '$markerKey';" | Out-String).Trim()
if ($found -eq $markerVal) {
    Write-Host "    ✅ ДАННЫЕ СОХРАНЕНЫ: $found"
} else {
    Write-Host "    ❌ ДАННЫЕ ПОТЕРЯНЫ: ожидалось '$markerVal', получено '$found'"
    exit 1
}

Write-Host "`n=== 5. Убираю маркер ==="
Invoke-AppSql "DELETE FROM siteSettings WHERE ``key`` = '$markerKey';"
Write-Host "    готово"
Write-Host "`nИТОГ: персистентность подтверждена — данные выжили полное пересоздание контейнера."
