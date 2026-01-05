@echo off
echo ===================================================
echo   Agent AI Local Companion Setup
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Checking dependencies...
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
) else (
    echo [INFO] Dependencies found, skipping install.
)

echo.
echo [2/3] Checking local model...
:: Run download script - it will skip automatically if model exists
node download-model.js

echo.
echo [3/3] Setup complete!
echo.
echo ===================================================
echo   LAUNCHING AGENT AI (Zero-Config)
echo ===================================================
echo 1. Starting Local Companion Server...
start "Agent AI Server" cmd /c "npm start"

echo 2. Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo 3. Opening Agent AI in your browser...
start "" "http://localhost:3000/projects/AgentAi/beta.html"

echo.
echo Launch successful! 
echo Keep the "Agent AI Server" terminal window open.
echo ===================================================
echo.
pause
