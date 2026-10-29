"""
Executa o fluxo completo de atualização da Central de Indicadores Dias+:
1. Baixa o Resumo de Viagens do dia e sobe para o Google Sheets (aba 'Viagens').
2. Baixa o Relatório de Pendências (90 dias), consolida e sobe para o Google Sheets (aba 'Pendencias').

Pode ser disparado manualmente ou via Agendador de Tarefas do Windows (Task Scheduler).
"""
import asyncio
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Ajusta encoding no terminal Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def log(msg: str):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


async def executar():
    inicio = time.time()
    log("=" * 60)
    log("🚀 INICIANDO ROTINA COMPLETA DE AUTOMAÇÃO - DIAS+")
    log("=" * 60)

    # 1. Executa Viagens
    log("PASSO 1/2: Baixando e enviando Resumo de Viagens...")
    try:
        import baixar_viagens
        await baixar_viagens.main()
        log("✅ Viagens finalizadas com sucesso.")
    except Exception as e:
        log(f"❌ Erro na rotina de Viagens: {e}")

    log("-" * 60)

    # 2. Executa Pendências
    log("PASSO 2/2: Baixando e enviando Relatório de Pendências (90 dias)...")
    try:
        import baixar_pendencias
        await baixar_pendencias.main()
        log("✅ Pendências finalizadas com sucesso.")
    except Exception as e:
        log(f"❌ Erro na rotina de Pendências: {e}")

    duracao = time.time() - inicio
    log("=" * 60)
    log(f"🎉 ROTINA CONCLUÍDA EM {duracao:.1f}s")
    log("=" * 60)


if __name__ == "__main__":
    asyncio.run(executar())

