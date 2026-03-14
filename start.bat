@echo off
title Waifu Wallet

:: ─── Check tools ─────────────────────────────
where python >nul 2>&1
if %errorlevel% neq 0 (
  echo  Python nao encontrado. Rode setup.bat primeiro!
  pause
  exit /b 1
)
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  Node.js nao encontrado. Rode setup.bat primeiro!
  pause
  exit /b 1
)
where uv >nul 2>&1
if %errorlevel% neq 0 (
  echo  uv nao encontrado. Rode setup.bat primeiro!
  pause
  exit /b 1
)

:: ─── Auto-install dependencies if needed ─────
if not exist "backend\.venv" (
  echo  Instalando dependencias do backend...
  cd /d "%~dp0backend"
  call uv sync
  cd /d "%~dp0"
  if not exist "backend\.venv" (
    echo  [ERRO] Falha ao instalar dependencias do backend.
    pause
    exit /b 1
  )
)

if not exist "frontend\node_modules" (
  echo  Instalando dependencias do frontend...
  cd /d "%~dp0frontend"
  call npm install
  cd /d "%~dp0"
  if not exist "frontend\node_modules" (
    echo  [ERRO] Falha ao instalar dependencias do frontend.
    pause
    exit /b 1
  )
)

echo.
echo  Waifu Wallet iniciando...
echo.

:: ─── Start backend ───────────────────────────
start /min "Waifu Wallet Backend" cmd /c "cd /d "%~dp0backend" && uv run uvicorn main:app --reload"

timeout /t 2 /nobreak >nul

:: ─── Start frontend ──────────────────────────
start /min "Waifu Wallet Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

:: ─── Open browser ────────────────────────────
start http://localhost:5173

echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo.
echo  Para fechar, feche as janelas do terminal
echo  que abriram (Backend e Frontend).
echo.
