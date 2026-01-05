@echo off
setlocal
set LOGFILE=setup-log.txt

echo =================================================== > "%LOGFILE%"
echo   Agent AI Local Companion Setup Log             >> "%LOGFILE%"
echo   Date: %DATE% %TIME%                            >> "%LOGFILE%"
echo =================================================== >> "%LOGFILE%"

echo ===================================================
echo   Agent AI Local Companion Setup
echo ===================================================
echo.

:: 1. Environment Check
echo [1/4] Checking Environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org/
    echo [ERROR] Node.js missing. >> "%LOGFILE%"
    goto onerror
)
echo [OK] Node.js found. >> "%LOGFILE%"

:: 2. Dependencies
echo [2/4] Verifying Dependencies...
if not exist "node_modules" (
    echo [INFO] Installing required packages...
    call npm install >> "%LOGFILE%" 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed. Check %LOGFILE%.
        goto onerror
    )
)
echo [OK] Dependencies verified. >> "%LOGFILE%"

:: 3. Local Model
echo [3/4] Preparing Local Model...
node download-model.js >> "%LOGFILE%" 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Model setup issues detected. See %LOGFILE%.
)

:: 4. Launch
echo [4/4] Finalizing Setup...
echo.
echo ===================================================
echo   LAUNCHING AGENT AI
echo ===================================================
echo [INFO] Starting Local Server...
start "Agent AI Server" cmd /c "npm start"

timeout /t 2 /nobreak >nul
echo [INFO] Opening UI in Browser...
start "" "http://127.0.0.1:3000/projects/AgentAi/beta.html"

echo SUCCESS: Agent AI is ready!
echo Local companion is serving the UI and handling tasks.
echo.
echo NOTE: Ensure your local LLM (e.g., Ollama) is running
echo to use the Reasoning/Multi-Agent features offline.
echo ===================================================
echo.
pause
exit /b 0

:onerror
echo.
echo ===================================================
echo   SETUP FAILED
echo ===================================================
echo Please check %LOGFILE% for detailed errors.
echo.
pause
exit /b 1
