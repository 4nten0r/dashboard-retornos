@echo off
chcp 65001 > nul
echo ======================================================
echo  Iniciando Automacao da Central de Indicadores Dias+
echo ======================================================

cd /d "%~dp0"
if errorlevel 1 exit /b 1

set "DIASLOG_HEADLESS=1"
if not exist "%~dp0outputs" mkdir "%~dp0outputs"
py executar_rotina.py >> "%~dp0outputs\rotina_diaria.log" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo [ERRO] A execucao encontrou falhas.
) else (
    echo [SUCESSO] Rotina concluida com sucesso.
)

exit /b %EXIT_CODE%
