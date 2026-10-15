@echo off
title NeoChess - Free Internet Multiplayer Tunnel
echo ==========================================================
echo   NeoChess - Public Internet Multiplayer ($0 Zero Cost)
echo ==========================================================
echo.

set "CLOUDFLARED_EXE=%~dp0..\bin\cloudflared.exe"

if exist "%CLOUDFLARED_EXE%" (
    goto :RUN_TUNNEL
)

where cloudflared >nul 2>nul
if %errorlevel% equ 0 (
    set "CLOUDFLARED_EXE=cloudflared"
    goto :RUN_TUNNEL
)

echo [!] cloudflared was not found on your system.
echo.
echo Please run scripts\start_internet_tunnel.ps1 to download it automatically.
pause >nul
exit /b 1

:RUN_TUNNEL
echo [+] Using cloudflared at: %CLOUDFLARED_EXE%
echo [+] Starting tunnel to http://localhost:5173 (Web, API and Socket.IO)...
echo.
echo Share the generated https://*.trycloudflare.com link with your friends!
echo.
"%CLOUDFLARED_EXE%" tunnel --url http://127.0.0.1:5173
pause
