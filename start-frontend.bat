@echo off
REM Start frontend service

cd /d "%~dp0frontend"

echo ==================================================
echo Starting Doc Explorer Frontend Service
echo ==================================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies already exist
)

echo.
echo Starting frontend dev server...
echo Access: http://localhost:5173
echo.
echo Press Ctrl+C to stop service
echo.

npm run dev

pause
