@echo off
set LOGFILE=setup-log.txt
echo =================================================== > %LOGFILE%
echo   Agent AI Local Companion Setup Log             >> %LOGFILE%
echo   Date: %DATE% %TIME%                            >> %LOGFILE%
echo =================================================== >> %LOGFILE%

echo ===================================================
echo   Agent AI Local Companion Setup
echo ===================================================
echo.

:: Check for Node.js
echo [1/4] Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    echo [ERROR] Node.js is not installed. >> %LOGFILE%
    pause
    exit /b
)
echo [OK] Node.js is installed. >> %LOGFILE%

echo [2/4] Checking dependencies...
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    echo [INFO] This includes a small browser for automation (Puppeteer).
    echo [INFO] Installing dependencies... >> %LOGFILE%
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies. Check %LOGFILE% for details.
        pause
        exit /b
    )
    echo [OK] Dependencies installed successfully. >> %LOGFILE%
) else (
    echo [INFO] Dependencies found, skipping install.
    echo [INFO] Dependencies found, skipping install. >> %LOGFILE%
)

echo.
echo [3/4] Checking local model...
echo [INFO] Checking local model... >> %LOGFILE%
:: Run download script - it will skip automatically if model exists
node download-model.js >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Model download/check failed. Check %LOGFILE% for details.
    echo [WARNING] You can still use the agent with Online mode or external local providers.
)

echo.
echo [4/4] Setup complete!
echo.
echo ===================================================
echo   LAUNCHING AGENT AI
echo ===================================================
echo 1. Starting Local Companion Server...
echo [INFO] Launching server... >> %LOGFILE%
start "Agent AI Server" cmd /c "npm start"

echo 2. Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo 3. Opening Agent AI in your browser...
echo [INFO] Opening browser... >> %LOGFILE%
start "" "http://127.0.0.1:3000/projects/AgentAi/beta.html"

echo.
echo Launch successful! 
echo Keep the "Agent AI Server" terminal window open.
echo If you have issues, check %LOGFILE%.
echo ===================================================
echo.
pause
