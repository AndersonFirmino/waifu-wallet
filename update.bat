@echo off
setlocal enabledelayedexpansion
title Waifu Wallet - Atualizacao

echo.
echo  ========================================
echo       Waifu Wallet - Atualizador
echo  ========================================
echo.
echo  Isto vai baixar a versao mais recente do
echo  Waifu Wallet do GitHub e atualizar os arquivos
echo  da sua instalacao.
echo.
echo  Seus dados serao PRESERVADOS:
echo    - Banco de dados (meucaixa.db)
echo    - Imagens dos banners (gacha\)
echo    - Dependencias instaladas
echo.
echo  ========================================
echo.
pause

:: ─── Define paths ────────────────────────────
set "INSTALL_DIR=%~dp0"
set "TEMP_DIR=%TEMP%\waifu-wallet-update"
set "ZIP_URL=https://github.com/AndersonFirmino/waifu-wallet/archive/refs/heads/master.zip"
set "ZIP_FILE=%TEMP_DIR%\waifu-wallet-latest.zip"
set "EXTRACTED_DIR=%TEMP_DIR%\waifu-wallet-master"

:: ─── Create temp dir ─────────────────────────
if exist "%TEMP_DIR%" (
  echo  Limpando pasta temporaria anterior...
  rmdir /s /q "%TEMP_DIR%"
)
mkdir "%TEMP_DIR%"
if %errorlevel% neq 0 (
  echo.
  echo  [ERRO] Nao foi possivel criar a pasta temporaria:
  echo         %TEMP_DIR%
  echo.
  pause
  exit /b 1
)

:: ─── Download ZIP ────────────────────────────
echo.
echo  [1/4] Baixando a versao mais recente...
echo        (pode demorar dependendo da sua internet)
echo.
powershell -Command "& { $ProgressPreference = 'SilentlyContinue'; try { Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing; Write-Host 'Download concluido.' } catch { Write-Host '[ERRO] Falha ao baixar o arquivo.'; Write-Host $_.Exception.Message; exit 1 } }"
if %errorlevel% neq 0 (
  echo.
  echo  [ERRO] Nao foi possivel baixar a atualizacao.
  echo.
  echo  Verifique sua conexao com a internet e tente novamente.
  echo.
  goto :cleanup_fail
)

:: ─── Extract ZIP ─────────────────────────────
echo.
echo  [2/4] Extraindo arquivos...
echo.
powershell -Command "& { try { Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TEMP_DIR%' -Force; Write-Host 'Extracao concluida.' } catch { Write-Host '[ERRO] Falha ao extrair o arquivo ZIP.'; Write-Host $_.Exception.Message; exit 1 } }"
if %errorlevel% neq 0 (
  echo.
  echo  [ERRO] Nao foi possivel extrair o arquivo baixado.
  echo.
  goto :cleanup_fail
)

if not exist "%EXTRACTED_DIR%" (
  echo.
  echo  [ERRO] Estrutura do arquivo ZIP inesperada.
  echo         Pasta nao encontrada: %EXTRACTED_DIR%
  echo.
  goto :cleanup_fail
)

:: ─── Copy files (preserving user data) ───────
echo.
echo  [3/4] Atualizando arquivos...
echo        (seus dados estao sendo preservados)
echo.

:: Use PowerShell to copy files while excluding user data paths
powershell -Command "& { $src = '%EXTRACTED_DIR%\'; $dst = '%INSTALL_DIR%'; $excludeDirs = @('backend\.venv', 'backend\meucaixa.db', 'frontend\public\gacha', 'frontend\node_modules'); Get-ChildItem -Path $src -Recurse -File | ForEach-Object { $rel = $_.FullName.Substring($src.Length); $skip = $false; foreach ($ex in $excludeDirs) { if ($rel -like ($ex + '*') -or $rel -eq $ex) { $skip = $true; break } }; if (-not $skip) { $target = Join-Path $dst $rel; $targetDir = Split-Path $target -Parent; if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }; Copy-Item -Path $_.FullName -Destination $target -Force } }; Write-Host 'Copia concluida.' }"
if %errorlevel% neq 0 (
  echo.
  echo  [ERRO] Falha ao copiar os arquivos atualizados.
  echo.
  goto :cleanup_fail
)

:: ─── Update dependencies ─────────────────────
echo.
echo  [4/4] Atualizando dependencias...
echo.

echo        Backend...
cd /d "%INSTALL_DIR%backend"
call uv sync
if %errorlevel% neq 0 (
  echo.
  echo  [AVISO] Falha ao atualizar dependencias do backend.
  echo          Tente rodar setup.bat novamente.
  echo.
)

echo.
echo        Frontend...
cd /d "%INSTALL_DIR%frontend"
call npm install
if %errorlevel% neq 0 (
  echo.
  echo  [AVISO] Falha ao atualizar dependencias do frontend.
  echo          Tente rodar setup.bat novamente.
  echo.
)

:: ─── Cleanup ─────────────────────────────────
echo.
echo  Removendo arquivos temporarios...
rmdir /s /q "%TEMP_DIR%"

echo.
echo  ========================================
echo.
echo   Atualizacao concluida!
echo.
echo   Execute start.bat para abrir o Waifu Wallet.
echo.
echo  ========================================
echo.
pause
exit /b 0

:: ─── Cleanup on failure ───────────────────────
:cleanup_fail
echo  Removendo arquivos temporarios...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
echo.
pause
exit /b 1
