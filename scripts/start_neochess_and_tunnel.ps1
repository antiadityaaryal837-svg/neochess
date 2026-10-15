<#
.SYNOPSIS
    NeoChess - 1-Click Server & Internet Tunnel Launcher
#>

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Host "================================================================" -ForegroundColor Green
Write-Host "    NeoChess - Starting All Servers and Cloudflare Tunnel       " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# 1. Free ports 3001 and 5173 if currently occupied
$occupiedPids = Get-NetTCPConnection -LocalPort 3001, 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $occupiedPids) {
    if ($p -and $p -ne 0) {
        Write-Host "[*] Freeing occupied port by process $p..." -ForegroundColor Yellow
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}

# 2. Launch dev servers in a separate window
Write-Host "[1/3] Starting NeoChess backend and frontend (npm run dev)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; Write-Host '=== NeoChess Dev Servers ===' -ForegroundColor Green; npm run dev"

# 3. Wait for ports to become active
Write-Host "[2/3] Waiting for servers to initialize on ports 3001 and 5173..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# 4. Locate cloudflared.exe
$cloudflaredExe = Join-Path $root "bin\cloudflared.exe"
if (-not (Test-Path $cloudflaredExe)) {
    $cmd = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if ($cmd) {
        $cloudflaredExe = $cmd.Source
    } else {
        Write-Host "Downloading portable cloudflared.exe..." -ForegroundColor Yellow
        $binDir = Join-Path $root "bin"
        New-Item -ItemType Directory -Force -Path $binDir | Out-Null
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredExe
    }
}

# 5. Launch tunnel
Write-Host "[3/3] Opening Public Internet Tunnel to http://127.0.0.1:5173..." -ForegroundColor Green
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Copy your https://*.trycloudflare.com link below!            " -ForegroundColor Yellow
Write-Host "  IMPORTANT: KEEP THIS WINDOW OPEN while playing with friends.  " -ForegroundColor Yellow
Write-Host "  If you close this window, the public link will stop working.  " -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

& $cloudflaredExe tunnel --url http://127.0.0.1:5173
