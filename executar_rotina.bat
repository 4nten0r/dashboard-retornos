@echo off
chcp 65001 > nul
echo ======================================================
echo  Iniciando Automacao da Central de Indicadores Dias+
echo ======================================================

cd /d "%~dp0"

py executar_rotina.py

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] A execucao encontrou falhas.
) else (
    echo [SUCESSO] Rotina concluida com sucesso.
)

pause

