@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 or newer required.
  pause
  exit /b 1
)
node tools\run-transit-preview.mjs --twolevel
if errorlevel 1 pause
