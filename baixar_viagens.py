"""
Baixa o Relatorio de Resumo de Viagens do sistema Diaslog (dia atual).

Passos (conforme operacao):
  Data inicial = Data final = hoje | Tipo de Relatorio = Completo |
  Tipo de Viagem = Normal (Repasse desmarcado) | Filial = todos (padrao) |
  Motorista = todos (padrao) | Cliente = todos | Tipo de Entrega = todos |
  Gerar Relatorio -> abre nova aba -> Exportar para Excel.

Saida : outputs/viagens/AAAA-MM-DD/resumo_viagens_AAAAMMDD.xlsx
Upload: aba "Viagens" do Google Sheet (via mesmo Apps Script Web App do
        baixar_pendencias.py), sem colunas Ajudante/Setores (PF/desorganizado).

Uso:
    py baixar_viagens.py
"""

import asyncio
import io
import os
import sys
from datetime import datetime
from pathlib import Path

# Garante saida UTF-8 no terminal Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import pandas as pd
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

# ── Credenciais ───────────────────────────────────────────────────────────────
# Lidas automaticamente de um arquivo .env ao lado deste script (NUNCA no codigo,
# NUNCA no Git — o .env esta no .gitignore). Tambem aceita variaveis de ambiente.
#
# Crie um arquivo .env com:
#   DIASLOG_USUARIO=seu_usuario
#   DIASLOG_SENHA=sua_senha
def _carregar_env():
    """Le o arquivo .env (KEY=VALUE por linha) para os.environ, sem dependencias."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for linha in env_path.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        chave, valor = chave.strip(), valor.strip().strip('"').strip("'")
        os.environ.setdefault(chave, valor)  # env do sistema tem prioridade


_carregar_env()

USUARIO = os.environ.get("DIASLOG_USUARIO", "")
SENHA   = os.environ.get("DIASLOG_SENHA",   "")

if not USUARIO or not SENHA:
    raise SystemExit(
        "Credenciais nao encontradas. Crie um arquivo .env ao lado do script com:\n"
        "  DIASLOG_USUARIO=seu_usuario\n"
        "  DIASLOG_SENHA=sua_senha"
    )

# ── URLs ──────────────────────────────────────────────────────────────────────
URL_LOGIN   = "https://sistema.diaslog.com.br/Login"
URL_VIAGENS = "https://sistema.diaslog.com.br/restrito/Relatorio_ResumoViagens.aspx"

# Resumo de Viagens: aba do Sheet e colunas que NAO sobem (ajudante=PF; setores=baguncado)
VIAGENS_ABA       = "Viagens"
VIAGENS_DESCARTAR = ["Ajudante", "Setores"]

# ── Google Sheets (upload automatico) ──────────────────────────────────────────
# Upload via Apps Script Web App (sem Google Cloud / sem service account).
# URL e token ficam no .env (fora do Git), mesmas chaves do baixar_pendencias.py:
#   SHEETS_WEBAPP_URL=https://script.google.com/macros/s/.../exec
#   SHEETS_WEBAPP_TOKEN=<segredo>
WEBAPP_URL   = os.environ.get("SHEETS_WEBAPP_URL", "")
WEBAPP_TOKEN = os.environ.get("SHEETS_WEBAPP_TOKEN", "")

# ── Data e pasta de saida ─────────────────────────────────────────────────────
HOJE = datetime.today()
PASTA_SAIDA = Path("outputs") / "viagens" / HOJE.strftime("%Y-%m-%d")

# ── True = sem janela (usar apos estavel); False = browser visivel (debug) ────
HEADLESS = False


def log(msg: str):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


async def fazer_login(page):
    log("Acessando pagina de login...")
    await page.goto(URL_LOGIN, wait_until="networkidle", timeout=30_000)
    await page.locator(
        "input[type='text'], input[name*='user' i], input[id*='user' i], input[id*='login' i]"
    ).first.fill(USUARIO)
    await page.locator("input[type='password']").first.fill(SENHA)
    await page.locator("a:has-text('Entrar'), input[type='submit'], button[type='submit']").first.click()
    await page.wait_for_load_state("networkidle", timeout=30_000)
    log("Login realizado.")


async def _texto_checkbox(cb) -> str:
    return await cb.evaluate("""el => {
        if (el.id) {
            const lbl = document.querySelector('label[for="' + el.id + '"]');
            if (lbl) return lbl.innerText.trim();
        }
        if (el.labels && el.labels.length) return el.labels[0].innerText.trim();
        let sib = el.nextSibling;
        while (sib) {
            if (sib.textContent && sib.textContent.trim()) return sib.textContent.trim();
            sib = sib.nextSibling;
        }
        return el.parentElement ? el.parentElement.innerText.trim() : '';
    }""")


async def baixar_resumo_viagens(page, ctx) -> Path | None:
    """Baixa o Relatorio de Resumo de Viagens do dia atual.

    Passos (conforme operacao):
      datas inicial=final=hoje | Tipo de Relatorio=Completo |
      Tipo de Viagem=Normal | Filial=todos | Motorista=todos |
      Cliente=todos | Tipo de Entrega=todos | Gerar Relatorio ->
      abre nova aba -> Exportar para Excel.
    """
    hoje = HOJE.strftime("%d/%m/%Y")
    log(f"--- Resumo de Viagens: {hoje} ---")
    await page.goto(URL_VIAGENS, wait_until="networkidle", timeout=30_000)

    # 1) Datas inicial e final = hoje (primeiros 2 campos de texto visiveis)
    inputs = await page.locator("input[type='text']:visible").all()
    log(f"Campos de texto encontrados: {len(inputs)}")
    if len(inputs) >= 2:
        await inputs[0].fill(hoje)
        await inputs[1].fill(hoje)
    else:
        raise RuntimeError("Nao encontrei os campos de data inicial/final.")

    # 2) Tipo de Relatorio = Completo (radio)
    for radio in await page.locator("input[type='radio']").all():
        txt = await radio.evaluate("""el => {
            if (el.id) { const l=document.querySelector('label[for="'+el.id+'"]');
                         if (l) return l.innerText; }
            return el.parentElement ? el.parentElement.innerText : ''; }""")
        if "completo" in (txt or "").lower():
            if not await radio.is_checked():
                await radio.check()
            log("Tipo de Relatorio: Completo")
            break

    # 3) Tipo de Viagem: Normal marcado, Repasse desmarcado
    for cb in await page.locator("input[type='checkbox']").all():
        txt = (await _texto_checkbox(cb) or "").lower()
        if "normal" in txt and not await cb.is_checked():
            await cb.check()
        elif "repasse" in txt and await cb.is_checked():
            await cb.uncheck()

    # 4) Filial e Motorista ja vem como "todos" por padrao — nao mexe.

    # 5) Cliente + Tipo de Entrega = TODOS (listboxes multi-selecao)
    #    Seleciona todas as opcoes de cada <select multiple>/<select size> e
    #    dispara 'change' (ASP.NET registra a selecao). Retorna contagem por lista.
    counts = await page.evaluate("""() => {
        const sels = document.querySelectorAll('select[multiple], select[size]');
        const r = [];
        sels.forEach(sel => {
            let n = 0;
            for (const opt of sel.options) { opt.selected = true; n++; }
            sel.dispatchEvent(new Event('change', {bubbles: true}));
            r.push(n);
        });
        return r;
    }""")
    log(f"Listas multi-selecao marcadas (itens por lista): {counts}")
    if not counts:
        log("AVISO: nenhuma lista multi-selecao encontrada (Cliente/Tipo Entrega).")
    await page.wait_for_timeout(500)
    await page.screenshot(path=str(PASTA_SAIDA / "viagens_form.png"))

    # 6) Gerar Relatorio: o link é o ÍCONE ao lado do texto. Localiza o elemento
    #    clicavel (img/a/input) proximo ao texto "Gerar Relatorio" e marca com id.
    marcado = await page.evaluate("""() => {
        const xp = document.evaluate(
            "//*[contains(normalize-space(.),'Gerar Relat')]",
            document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (!xp.snapshotLength) return 'sem-texto';
        const node = xp.snapshotItem(xp.snapshotLength - 1);  // mais especifico
        const cont = node.closest('td, div, span, p, a') || node.parentElement;
        let alvo = cont.querySelector("a, img, input[type='image']")
                 || node.previousElementSibling || node;
        alvo.id = '__gerar_btn';
        return alvo.tagName + (alvo.onclick ? '(onclick)' : '');
    }""")
    log(f"Alvo do 'Gerar Relatorio': {marcado}")
    if marcado == "sem-texto":
        raise RuntimeError("Texto 'Gerar Relatorio' nao encontrado na pagina.")

    log("Aguardando a nova aba do relatorio abrir (pode demorar ate 3 min)...")
    try:
        async with ctx.expect_page(timeout=180_000) as nova_aba_info:
            await page.locator("#__gerar_btn").click()
        aba = await nova_aba_info.value
        log("Relatorio abriu em nova aba.")
    except PWTimeout:
        log("Nova aba nao abriu em 3 min; tentando na propria pagina.")
        aba = page
    try:
        await aba.wait_for_load_state("domcontentloaded", timeout=60_000)
    except PWTimeout:
        pass

    # 7) Exportar para o excel -> download. Espera o botao aparecer (sem networkidle).
    botao = aba.locator(
        "input[value*='Exportar' i], button:has-text('Exportar'), "
        "a:has-text('Exportar'), [id*='export' i], "
        "input[value*='Excel' i], button:has-text('Excel')")
    log("Aguardando o botao 'Exportar para o excel'...")
    await botao.first.wait_for(state="visible", timeout=120_000)
    log("Botao visivel; exportando...")
    async with aba.expect_download(timeout=120_000) as dl_info:
        await botao.first.click()
    download = await dl_info.value
    destino = PASTA_SAIDA / f"resumo_viagens_{HOJE:%Y%m%d}.xlsx"
    await download.save_as(destino)
    log(f"Resumo de Viagens salvo: {destino.name}")
    return destino


def _detectar_header_viagens(arq: Path) -> int:
    probe = pd.read_excel(arq, engine="openpyxl", header=None, nrows=15)
    for i in range(len(probe)):
        if "Motorista" in [str(x).strip() for x in probe.iloc[i].tolist()]:
            return i
    return 7


def enviar_viagens_para_sheets(arquivo: Path):
    """Envia o Resumo de Viagens para a aba 'Viagens' do Sheet (Apps Script Web App)."""
    import urllib.request
    import urllib.parse

    if not WEBAPP_URL or not WEBAPP_TOKEN:
        log("AVISO: SHEETS_WEBAPP_URL/TOKEN nao definidos. Upload de viagens ignorado.")
        return

    hdr = _detectar_header_viagens(arquivo)
    df = pd.read_excel(arquivo, engine="openpyxl", header=hdr).dropna(how="all")
    df = df[df["Motorista"].notna()].copy()
    df = df.drop(columns=[c for c in VIAGENS_DESCARTAR if c in df.columns])

    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime("%Y-%m-%d")
    df = df.where(pd.notna(df), "")
    ts = datetime.fromtimestamp(arquivo.stat().st_mtime)
    df["Atualizado em"] = ts.strftime("%d/%m/%Y %H:%M")

    csv_bytes = df.to_csv(index=False).encode("utf-8")
    url = WEBAPP_URL + "?" + urllib.parse.urlencode(
        {"token": WEBAPP_TOKEN, "aba": VIAGENS_ABA})
    req = urllib.request.Request(url, data=csv_bytes, method="POST",
                                 headers={"Content-Type": "text/csv; charset=utf-8"})
    log(f"Enviando {len(df)} linhas de viagens ao Web App (aba '{VIAGENS_ABA}')...")
    with urllib.request.urlopen(req, timeout=180) as resp:
        log(f"Resposta (viagens): {resp.read().decode('utf-8', errors='replace').strip()}")


async def main():
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    log("=" * 55)
    log("Resumo de Viagens - Diaslog (dia atual)")
    log(f"Destino: {PASTA_SAIDA.resolve()}")
    log("=" * 55)

    arquivo_viagens: Path | None = None

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(channel="msedge", headless=HEADLESS)
        ctx = await browser.new_context(accept_downloads=True)
        page = await ctx.new_page()

        try:
            await fazer_login(page)
            arquivo_viagens = await baixar_resumo_viagens(page, ctx)
        except PWTimeout as e:
            log(f"TIMEOUT: {e}")
            await page.screenshot(path=str(PASTA_SAIDA / "erro_timeout.png"))
            raise
        except Exception as e:
            log(f"ERRO: {e}")
            await page.screenshot(path=str(PASTA_SAIDA / "erro.png"))
            raise
        finally:
            await browser.close()

    if arquivo_viagens is not None:
        try:
            enviar_viagens_para_sheets(arquivo_viagens)
        except Exception as e:
            log(f"AVISO: falha ao enviar viagens para o Google Sheets: {e}")
            log("       O arquivo local foi salvo normalmente.")

    log("Concluido.")


if __name__ == "__main__":
    asyncio.run(main())
