@echo off
setlocal enabledelayedexpansion
title Waifu Wallet - Setup

echo.
echo  ========================================
echo       Waifu Wallet - Setup Automatico
echo  ========================================
echo.
echo  Este setup vai verificar e instalar
echo  as ferramentas necessarias para rodar
echo  o Waifu Wallet no seu computador:
echo.
echo    - Python 3.13 (linguagem do backend)
echo    - Node.js LTS  (linguagem do frontend)
echo    - uv           (gerenciador de pacotes Python)
echo.
echo  Tudo eh instalado via winget (loja oficial
echo  da Microsoft, ja vem no Windows 10/11).
echo  Nenhum programa estranho sera instalado.
echo.
echo  ========================================
echo.
pause

set "NEED_RESTART=0"

:: ─── Check winget ────────────────────────────
winget --version >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  [ERRO] winget nao encontrado.
  echo.
  echo  O winget eh o instalador oficial da Microsoft.
  echo  Ele ja vem no Windows 10/11, mas pode estar
  echo  desatualizado. Para resolver:
  echo.
  echo    1. Abra a Microsoft Store
  echo    2. Procure por "Instalador de Aplicativo"
  echo    3. Clique em "Atualizar"
  echo.
  echo  Ou acesse: https://aka.ms/getwinget
  echo.
  pause
  exit /b 1
)

:: ─── Check Python ────────────────────────────
where python >nul 2>&1
if %errorlevel% neq 0 (
  echo  [1/4] Python nao encontrado. Instalando Python 3.13...
  echo        (linguagem usada no servidor/backend)
  echo.
  winget install Python.Python.3.13 --accept-package-agreements --accept-source-agreements -h
  if !errorlevel! neq 0 (
    echo.
    echo  [ERRO] Falha ao instalar Python.
    echo         Instale manualmente: https://python.org/downloads
    echo         IMPORTANTE: Marque "Add Python to PATH" durante a instalacao!
    pause
    exit /b 1
  )
  echo        Python instalado!
  set "NEED_RESTART=1"
) else (
  for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do echo  [1/4] Python %%v ... OK
)

:: ─── Check Node.js ───────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [2/4] Node.js nao encontrado. Instalando Node.js LTS...
  echo        (linguagem usada na interface/frontend)
  echo.
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements -h
  if !errorlevel! neq 0 (
    echo.
    echo  [ERRO] Falha ao instalar Node.js.
    echo         Instale manualmente: https://nodejs.org
    pause
    exit /b 1
  )
  echo        Node.js instalado!
  set "NEED_RESTART=1"
) else (
  for /f "tokens=1 delims=" %%v in ('node --version 2^>^&1') do echo  [2/4] Node.js %%v ... OK
)

:: ─── Check uv ────────────────────────────────
where uv >nul 2>&1
if %errorlevel% neq 0 (
  echo  [3/4] uv nao encontrado. Instalando uv...
  echo        (gerenciador de pacotes do Python, tipo npm)
  echo.
  winget install astral-sh.uv --accept-package-agreements --accept-source-agreements -h
  if !errorlevel! neq 0 (
    echo.
    echo  [ERRO] Falha ao instalar uv.
    pause
    exit /b 1
  )
  echo        uv instalado!
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
  echo   Para que o Windows reconheca os novos
  echo   programas, voce precisa:
  echo.
  echo     1. FECHAR esta janela
  echo     2. Abrir uma nova (duplo clique no
  echo        setup.bat de novo)
  echo.
  echo   Na segunda vez ele vai instalar as
  echo   dependencias do projeto e finalizar.
  echo  ========================================
  echo.
  pause
  exit /b 0
)

:: ─── Install project dependencies ────────────
echo.
echo  [4/4] Instalando dependencias do projeto...
echo        (isso pode demorar uns minutos)
echo.

echo        Backend (servidor)...
cd /d "%~dp0backend"
call uv sync
if %errorlevel% neq 0 (
  echo  [ERRO] Falha ao instalar dependencias do backend.
  pause
  exit /b 1
)

echo.
echo        Frontend (interface)...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
  echo  [ERRO] Falha ao instalar dependencias do frontend.
  pause
  exit /b 1
)

echo.
echo  ========================================
echo.
echo   Setup completo! Tudo pronto.
echo.
echo   Para abrir o Waifu Wallet:
echo     Duplo clique no start.bat
echo.
echo   (o navegador vai abrir sozinho)
echo.
echo  ========================================
echo.
pause
