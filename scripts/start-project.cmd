@echo off
set "PROJECT_DIR=%~dp0.."
start "TeamMatch Backend" /min /d "%PROJECT_DIR%\server" cmd.exe /k "npm.cmd run dev"
start "TeamMatch Frontend" /min /d "%PROJECT_DIR%" cmd.exe /k "npm.cmd run dev -- --host 127.0.0.1"
