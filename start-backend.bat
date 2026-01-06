@echo off
REM Start backend service

cd /d "%~dp0backend"

echo ==================================================
echo Starting Doc Explorer Backend Service
echo ==================================================
echo.
echo Environment Check:
python --version
echo.

REM Clean port 8001
echo Cleaning port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8001"') do (
    taskkill /PID %%a /F 2>nul
)
timeout /t 1 /nobreak

REM Keep database, avoid clearing data on each startup
echo Database preserved

echo Starting backend service...
echo Access: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo.
echo Press Ctrl+C to stop service
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

pause
