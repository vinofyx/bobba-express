@echo off
echo ============================================
echo   Bobba Express — Logistics Platform
echo ============================================
echo.

echo [1/3] Starting MongoDB (if not running as service)...
net start MongoDB >nul 2>&1

echo [2/3] Starting Backend Server (port 5000)...
start "BobbaExpress - Backend" cmd /k "cd /d D:\Bobba Express\server && node src/server.js"

echo [3/3] Starting Frontend Server (port 8080)...
timeout /t 2 >nul
start "BobbaExpress - Frontend" cmd /k "cd /d D:\Bobba Express\client && npm run dev"

echo.
echo  Servers are starting up...
echo  Backend:   http://localhost:5000
echo  Frontend:  http://localhost:8080
echo  Tracking:  http://localhost:8080/tracking
echo.
timeout /t 4 >nul
start "" "http://localhost:8080"
