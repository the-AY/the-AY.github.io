@echo off
echo ===================================================
echo      Job Hunter Pro - Setup & Launch Script
echo ===================================================

echo [1/3] Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install Python 3.9+.
    pause
    exit /b
)

echo [2/3] Installing Dependencies (if missing)...
pip install -r requirements.txt

echo [2.5] Downloading Spacy English Model...
python -m spacy download en_core_web_sm

echo [3/3] Launching Streamlit App...
streamlit run app.py

pause
