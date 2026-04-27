@echo off
echo Starting Bobba Express (Development Mode)...

start "Backend - Port 5000" cmd /k "cd /d D:\Bobba Express\server && npm run dev"
timeout /t 2 >nul
start "Frontend - Port 8080" cmd /k "cd /d D:\Bobba Express\client && npm run dev"

echo.
echo Both servers starting in development mode...
echo   Backend:  http://localhost:5000 (with auto-restart)
echo   Frontend: http://localhost:8080 (with hot reload)
echo.
timeout /t 3 >nul
start "" "http://localhost:8080"
