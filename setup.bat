@echo off
setlocal enabledelayedexpansion
title MeuCaixa - Setup

echo.
echo  ========================================
echo       MeuCaixa - Setup Automatico
echo  ========================================
echo.

set "NEED_RESTART=0"

:: ─── Check winget ────────────────────────────
winget --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERRO] winget nao encontrado.
  echo         Atualize o "Instalador de Aplicativo" na Microsoft Store
  echo         ou acesse: https://aka.ms/getwinget
  echo.
  pause
  exit /b 1
)

:: ─── Check Python ────────────────────────────
where python >nul 2>&1
if %errorlevel% neq 0 (
  echo  [1/4] Python nao encontrado. Instalando...
  winget install Python.Python.3.14 --accept-package-agreements --accept-source-agreements -h
  if !errorlevel! neq 0 (
    echo  [ERRO] Falha ao instalar Python.
    echo         Instale manualmente: https://python.org/downloads
    echo         Marque "Add Python to PATH" durante a instalacao!
    pause
    exit /b 1
  )
  set "NEED_RESTART=1"
) else (
  for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do echo  [1/4] Python %%v ... OK
)

:: ─── Check Node.js ───────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [2/4] Node.js nao encontrado. Instalando...
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements -h
  if !errorlevel! neq 0 (
    echo  [ERRO] Falha ao instalar Node.js.
    echo         Instale manualmente: https://nodejs.org
    pause
    exit /b 1
  )
  set "NEED_RESTART=1"
) else (
  for /f "tokens=1 delims=" %%v in ('node --version 2^>^&1') do echo  [2/4] Node.js %%v ... OK
)

:: ─── Check uv ────────────────────────────────
where uv >nul 2>&1
if %errorlevel% neq 0 (
  echo  [3/4] uv nao encontrado. Instalando...
  powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
  if !errorlevel! neq 0 (
    echo  [ERRO] Falha ao instalar uv.
    pause
    exit /b 1
  )
  set "NEED_RESTART=1"
) else (
  for /f "tokens=2 delims= " %%v in ('uv --version 2^>^&1') do echo  [3/4] uv %%v ... OK
)

:: ─── Need restart? ───────────────────────────
if "!NEED_RESTART!"=="1" (
  echo.
  echo  ========================================
  echo   Ferramentas instaladas com sucesso!
  echo.
  echo   FECHE este terminal, abra um novo
  echo   e rode setup.bat de novo para
  echo   instalar as dependencias do projeto.
  echo  ========================================
  echo.
  pause
  exit /b 0
)

:: ─── Install project dependencies ────────────
echo  [4/4] Instalando dependencias do projeto...
echo.

echo        Backend...
cd /d "%~dp0backend"
call uv sync
if %errorlevel% neq 0 (
  echo  [ERRO] Falha ao instalar dependencias do backend.
  pause
  exit /b 1
)

echo.
echo        Frontend...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
  echo  [ERRO] Falha ao instalar dependencias do frontend.
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   Setup completo!
echo.
echo   Para iniciar o MeuCaixa, rode:
echo     start.bat
echo  ========================================
echo.
pause
