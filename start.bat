@echo off
title MeuCaixa

:: ─── Check if setup was run ──────────────────
if not exist "backend\.venv" (
  echo  Primeira vez? Rode setup.bat antes!
  pause
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo  Primeira vez? Rode setup.bat antes!
  pause
  exit /b 1
)

echo.
echo  MeuCaixa iniciando...
echo.

:: ─── Start backend ───────────────────────────
start "MeuCaixa Backend" cmd /c "cd /d "%~dp0backend" && uv run uvicorn main:app --reload"

timeout /t 2 /nobreak >nul

:: ─── Start frontend ──────────────────────────
start "MeuCaixa Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

:: ─── Open browser ────────────────────────────
start http://localhost:5173

echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo.
echo  Para fechar, feche as janelas do terminal
echo  que abriram (Backend e Frontend).
echo.
