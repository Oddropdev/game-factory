@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 24 or newer.
  pause
  exit /b 1
)
node tools\run-transit-preview.mjs
if errorlevel 1 pause
