@echo off
title Waifu Wallet

:: ─── Auto-setup if needed ────────────────────
if not exist "backend\.venv" goto :run_setup
if not exist "frontend\node_modules" goto :run_setup
goto :start_app

:run_setup
echo.
echo  Primeira execucao detectada!
echo  Instalando dependencias automaticamente...
echo.
call "%~dp0setup.bat"
if %errorlevel% neq 0 (
  echo.
  echo  [ERRO] Setup falhou. Verifique os erros acima.
  pause
  exit /b 1
)
echo.
echo  Setup concluido! Iniciando Waifu Wallet...
echo.

:start_app

echo.
echo  Waifu Wallet iniciando...
echo.

:: ─── Start backend ───────────────────────────
start "Waifu Wallet Backend" cmd /c "cd /d "%~dp0backend" && uv run uvicorn main:app --reload"

timeout /t 2 /nobreak >nul

:: ─── Start frontend ──────────────────────────
start "Waifu Wallet Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

:: ─── Open browser ────────────────────────────
start http://localhost:5173

echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo.
echo  Para fechar, feche as janelas do terminal
echo  que abriram (Backend e Frontend).
echo.
