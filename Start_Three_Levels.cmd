@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist "playtest-dist\ball\index.html" (
  if not exist "package.json" (
    echo Extract the entire preview ZIP before starting.
    pause
    exit /b 1
  )
  if not exist "node_modules\vite" call npm install --no-audit --no-fund
  if errorlevel 1 goto :failed
  call npm run build:w9-4:ball
  if errorlevel 1 goto :failed
)
node tools\run-transit-preview.mjs --trilogy
if errorlevel 1 goto :failed
exit /b 0
:failed
pause
exit /b 1
