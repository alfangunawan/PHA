# Sync ngrok tunnel URLs into frontend/.env
# Run AFTER: ngrok start --all
# Maps:  port 3000 -> backend (EXPO_PUBLIC_API_URL)
#        port 8081 -> Metro   (EXPO_PACKAGER_PROXY_URL + REACT_NATIVE_PACKAGER_HOSTNAME)

$ErrorActionPreference = "Stop"
$envPath = Join-Path $PSScriptRoot ".env"

try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5
} catch {
    Write-Host "ERROR: ngrok not running (127.0.0.1:4040 unreachable). Start it first: ngrok start --all" -ForegroundColor Red
    exit 1
}

$backendUrl = $null
$metroUrl   = $null
foreach ($t in $resp.tunnels) {
    if ($t.proto -ne "https") { continue }
    $addr = $t.config.addr
    if ($addr -match "3000") { $backendUrl = $t.public_url }
    if ($addr -match "8081") { $metroUrl   = $t.public_url }
}

if (-not $backendUrl) { Write-Host "ERROR: no tunnel for port 3000 (backend)" -ForegroundColor Red; exit 1 }
if (-not $metroUrl)   { Write-Host "ERROR: no tunnel for port 8081 (Metro)"   -ForegroundColor Red; exit 1 }

$metroHost = ([System.Uri]$metroUrl).Host

$content = @"
EXPO_PUBLIC_API_URL=$backendUrl

# Metro tunnel (ngrok v3 manual) - auto-synced by sync-tunnels.ps1
EXPO_PACKAGER_PROXY_URL=$metroUrl
REACT_NATIVE_PACKAGER_HOSTNAME=$metroHost
"@

Set-Content -Path $envPath -Value $content -Encoding UTF8 -NoNewline

Write-Host "Updated .env:" -ForegroundColor Green
Write-Host "  EXPO_PUBLIC_API_URL            = $backendUrl"
Write-Host "  EXPO_PACKAGER_PROXY_URL        = $metroUrl"
Write-Host "  REACT_NATIVE_PACKAGER_HOSTNAME = $metroHost"
Write-Host ""
Write-Host "Now restart Expo:  npx expo start --clear" -ForegroundColor Cyan
