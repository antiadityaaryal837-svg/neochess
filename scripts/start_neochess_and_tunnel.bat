@echo off
title NeoChess - 1-Click Launch All & Internet Tunnel
echo ================================================================
echo     NeoChess - Starting All Servers and Cloudflare Tunnel
echo ================================================================
echo.

set "ROOT=%~dp0.."
cd /d "%ROOT%"

:: Free ports 3001 and 5173 if occupied by stray processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul

echo [1/3] Starting NeoChess Backend and Frontend...
start "NeoChess Dev Servers (Do Not Close)" cmd /k "cd /d %ROOT% && npm run dev"

echo [2/3] Waiting for servers to initialize on ports 3001 and 5173...
timeout /t 5 /nobreak >nul

set "CLOUDFLARED_EXE=%ROOT%\bin\cloudflared.exe"
if not exist "%CLOUDFLARED_EXE%" (
    where cloudflared >nul 2>nul
    if %errorlevel% equ 0 (
        set "CLOUDFLARED_EXE=cloudflared"
    ) else (
        echo [!] Downloading portable cloudflared.exe...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%ROOT%\bin\cloudflared.exe'"
    )
)

echo [3/3] Opening Public Internet Tunnel to http://127.0.0.1:5173...
echo.
echo ================================================================
echo   Look for your https://*.trycloudflare.com link below!
echo   KEEP THIS WINDOW OPEN while playing with friends.
echo   Press Ctrl+C to stop public access.
echo ================================================================
echo.

"%CLOUDFLARED_EXE%" tunnel --url http://127.0.0.1:5173
pause
