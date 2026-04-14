@echo off
title Smart Hotel POS — Starting...
color 0A

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Smart Hotel POS  v2.0            ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Change to the directory where this script is located
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: Node.js is not installed.
    echo  Please download from https://nodejs.org and install it.
    echo.
    pause
    exit /b 1
)

:: Install server dependencies if needed
if not exist "server\node_modules" (
    echo  Installing server dependencies (first run only)...
    cd server
    npm install
    cd ..
    echo  Done!
    echo.
)

echo  Starting server...
echo  ──────────────────────────────────────────
echo.
echo  Once started, open your browser and go to:
echo.
echo    This PC:    http://localhost:5000
echo    WiFi devs:  Check the console below for IP
echo.
echo  Default admin PIN:  1234
echo  ──────────────────────────────────────────
echo.

:: Start the server (it will print the WiFi IP in the console)
node server\index.js

pause
