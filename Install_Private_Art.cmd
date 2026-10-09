@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File tools\install-w9-5-ithappy.ps1
if errorlevel 1 (
 pause
 exit /b 1
)
call npm run build:w9-4:ball
pause
