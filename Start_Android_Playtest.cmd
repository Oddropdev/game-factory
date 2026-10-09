@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24+ is required. Install it on this Windows computer.
  pause
  exit /b 1
)
if not exist "playtest-dist\ball\index.html" (
  echo Missing preview files. Extract the ENTIRE GitHub Actions ZIP first.
  pause
  exit /b 1
)
echo.
echo W9.5 THREE WORLDS - ANDROID WI-FI PLAYTEST
echo --------------------------------------------------------
echo 1. Connect Windows PC and Android phone to the same Wi-Fi.
echo 2. Look for the "Android" URL shown below.
echo 3. Open that exact URL in Android Chrome.
echo 4. If Windows Firewall asks about Node.js, allow PRIVATE network.
echo 5. Press Ctrl+C here to stop sharing.
echo.
node tools\run-transit-preview.mjs --trilogy --lan
if errorlevel 1 (
  echo Could not start preview. Port 4177 may already be in use.
  pause
  exit /b 1
)
