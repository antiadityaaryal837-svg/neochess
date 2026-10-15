<#
.SYNOPSIS
    NeoChess - Zero-Cost ($0) Instant Internet Multiplayer Tunnel
.DESCRIPTION
    Exposes your local NeoChess server to the public internet securely using free Cloudflare Quick Tunnels.
    Your friends can connect from anywhere without port forwarding, dynamic DNS, or paid hosting.
#>

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  NeoChess - Public Internet Multiplayer ($0 Zero Cost)   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# Check if local bin or system cloudflared is installed
$localBin = Join-Path $PSScriptRoot "..\bin\cloudflared.exe"
$cloudflaredExe = $null

if (Test-Path $localBin) {
    $cloudflaredExe = (Resolve-Path $localBin).Path
} else {
    $cmd = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if ($cmd) {
        $cloudflaredExe = $cmd.Source
    }
}

if (-not $cloudflaredExe) {
    Write-Host "[!] Cloudflare Tunnel CLI (cloudflared) was not found." -ForegroundColor Yellow
    Write-Host "Downloading portable cloudflared.exe directly..." -ForegroundColor Cyan
    $binDir = Join-Path $PSScriptRoot "..\bin"
    New-Item -ItemType Directory -Force -Path $binDir | Out-Null
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $localBin
    $cloudflaredExe = $localBin
}

Write-Host "[+] cloudflared found at: $cloudflaredExe" -ForegroundColor Cyan
Write-Host "[+] Exposing NeoChess web client (port 5173) and backend API/sockets..." -ForegroundColor Cyan
Write-Host "[+] Generating your secure public HTTPS & WSS link..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Share the resulting https://*.trycloudflare.com link with your friends to play!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C at any time to stop public access." -ForegroundColor Gray
Write-Host ""

& $cloudflaredExe tunnel --url http://127.0.0.1:5173
