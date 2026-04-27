@echo off
echo Stopping Bobba Express...

taskkill /f /im node.exe >nul 2>&1

echo.
echo All servers stopped.
echo.
timeout /t 2 >nul
