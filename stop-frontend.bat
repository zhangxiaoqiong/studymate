@echo off
REM Stop frontend service

echo ==================================================
echo Stopping Doc Explorer Frontend Service
echo ==================================================
echo.

REM Kill process on port 5173
echo Stopping frontend service on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":5173"') do (
    taskkill /PID %%a /F 2>nul
    if !errorlevel! equ 0 (
        echo ✓ Frontend service stopped
    )
)

timeout /t 1 /nobreak
echo.
echo Frontend service has been stopped
echo.

pause
