@echo off
set "SERVER_DIR=%~dp0..\server"
start "TeamMatch Backend" /min /d "%SERVER_DIR%" cmd.exe /k "npm.cmd run dev"
