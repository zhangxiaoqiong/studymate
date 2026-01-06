@echo off
REM Stop backend service

echo ==================================================
echo Stopping Doc Explorer Backend Service
echo ==================================================
echo.

REM Kill process on port 8001
echo Stopping backend service on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8001"') do (
    taskkill /PID %%a /F 2>nul
    if !errorlevel! equ 0 (
        echo ✓ Backend service stopped
    )
)

timeout /t 1 /nobreak
echo.
echo Backend service has been stopped
echo.

pause
