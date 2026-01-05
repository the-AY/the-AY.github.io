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

echo [1/3] Installing dependencies...
call npm install
echo [SECURE] Running security audit fix...
call npm audit fix --force

echo.
echo.
echo [2/4] Checking for local model (Ollama)...
echo [INFO] Please ensure Ollama is running if you plan to use it.
echo [INFO] Default endpoint: http://localhost:11434

echo.
set /p download="[3/4] Would you like to download a small offline model (600MB) for local testing? (y/n): "
if /i "%download%"=="y" (
    echo [INFO] Starting download...
    node download-model.js
) else (
    echo [INFO] Skipping model download.
)

echo.
echo [4/4] Setup complete!
echo.
echo ===================================================
echo   LAUNCHING AGENT AI
echo ===================================================
echo 1. Starting Local Companion Server...
start "Agent AI Server" cmd /c "npm start"

echo 2. Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo 3. Opening Agent AI in your browser...
start "" "http://localhost:3000/projects/AgentAi/beta.html"

echo.
echo Setup and Launch successful! 
echo Keep the "Agent AI Server" terminal window open.
echo ===================================================
echo.
pause
