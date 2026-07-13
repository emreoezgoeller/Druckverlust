@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Druckverlust Pro - Lokaler Webserver

echo ============================================================
echo  Druckverlust Pro Startseite wird geoeffnet
echo ============================================================
echo.
echo  Dieses Fenster bitte geoeffnet lassen.
echo  Zum Beenden: Fenster schliessen oder STRG+C druecken.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-local-server.ps1"

if errorlevel 1 (
  echo.
  echo Der lokale Server konnte nicht gestartet werden.
  echo Bitte den angezeigten Hinweis pruefen.
  pause
)
