@echo off
echo Iniciando MeuCaixa v2...

if not exist "frontend\node_modules" (
  echo Instalando dependencias do frontend...
  cd frontend && npm install && cd ..
)

start "MeuCaixa Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Frontend rodando em http://localhost:5173
echo Backend ainda nao configurado (Fase 2)
