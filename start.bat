@echo off
echo Iniciando MeuCaixa v2...

if not exist "frontend\node_modules" (
  echo Instalando dependencias do frontend...
  cd frontend && npm install && cd ..
)

start "MeuCaixa Backend" cmd /k "cd /d "%~dp0backend" && uv run uvicorn main:app --reload"

timeout /t 2 /nobreak >nul

start "MeuCaixa Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
