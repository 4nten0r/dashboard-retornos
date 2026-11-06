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
        Mantem no Sheet o historico dos relatorios diarios locais dos ultimos
        365 dias para alimentar os graficos de tendencia.

Uso:
    py baixar_viagens.py
"""

import asyncio
import io
import os
import sys
from datetime import date, datetime, timedelta
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
HISTORICO_DIAS    = 365

# ── Google Sheets (upload automatico) ──────────────────────────────────────────
# Upload via Apps Script Web App (sem Google Cloud / sem service account).
# URL e token ficam no .env (fora do Git), mesmas chaves do baixar_pendencias.py:
#   SHEETS_WEBAPP_URL=https://script.google.com/macros/s/.../exec
#   SHEETS_WEBAPP_TOKEN=<segredo>
WEBAPP_URL   = os.environ.get("SHEETS_WEBAPP_URL", "")
WEBAPP_TOKEN = os.environ.get("SHEETS_WEBAPP_TOKEN", "")

# ── Data e pasta de saida ─────────────────────────────────────────────────────
HOJE = datetime.today() - timedelta(days=1)  # Dia anterior (automação alimenta com dados do dia anterior)
PASTA_SAIDA = Path("outputs") / "viagens" / HOJE.strftime("%Y-%m-%d")

# Defina DIASLOG_HEADLESS=1 para executar sem janela (ex.: Agendador do Windows).
HEADLESS = os.environ.get("DIASLOG_HEADLESS", "").strip().lower() in {
    "1", "true", "yes", "on",
}
BROWSER_CHANNEL = os.environ.get("DIASLOG_BROWSER_CHANNEL", "msedge").strip()


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


def _filtrar_historico_viagens(
    frame: pd.DataFrame, data_limite: date, data_fim: date
) -> pd.DataFrame:
    if frame.empty:
        return frame
    if "Data Entrega" not in frame or "Motorista" not in frame:
        raise RuntimeError("O historico de viagens precisa das colunas Data Entrega e Motorista.")

    frame = frame.drop(columns=["Atualizado em", *VIAGENS_DESCARTAR], errors="ignore").copy()
    delivery_dates = pd.to_datetime(frame["Data Entrega"], errors="coerce")
    valid_dates = delivery_dates.notna()
    valid_dates &= delivery_dates.dt.date >= data_limite
    valid_dates &= delivery_dates.dt.date <= data_fim
    frame = frame.loc[valid_dates].copy()
    delivery_dates = delivery_dates.loc[valid_dates]
    frame = frame[frame["Motorista"].fillna("").astype(str).str.strip().ne("")]
    delivery_dates = delivery_dates.loc[frame.index]
    frame["Data Entrega"] = delivery_dates.dt.strftime("%Y-%m-%d")

    for column in frame.select_dtypes(include=["datetime", "datetimetz"]).columns:
        frame[column] = frame[column].dt.strftime("%Y-%m-%d")
    return frame


def _carregar_historico_planilha() -> pd.DataFrame:
    import urllib.parse
    import urllib.request

    url = WEBAPP_URL + "?" + urllib.parse.urlencode({"sheet": VIAGENS_ABA})
    request = urllib.request.Request(url, headers={"Accept": "text/csv,text/plain;q=0.9"})
    with urllib.request.urlopen(request, timeout=60) as response:
        csv_text = response.read().decode("utf-8-sig")

    if not csv_text.strip():
        log("A aba Viagens ainda esta vazia; o historico sera iniciado com o relatorio de hoje.")
        return pd.DataFrame()
    if csv_text.lstrip().startswith("<") or csv_text.lstrip().lower().startswith(("erro", "sheet ")):
        raise RuntimeError("O Web App nao retornou CSV valido para a aba Viagens.")

    frame = pd.read_csv(io.StringIO(csv_text), dtype=str, keep_default_na=False)
    if frame.empty:
        return frame
    if "Data Entrega" not in frame or "Motorista" not in frame:
        raise RuntimeError("A aba Viagens da planilha nao contem as colunas obrigatorias.")
    log(f"Historico lido da planilha: {len(frame)} linha(s).")
    return frame


def carregar_historico_viagens() -> pd.DataFrame:
    """Usa a planilha como historico persistente e inclui relatorios locais disponiveis."""
    pasta_historico = Path(__file__).resolve().parent / "outputs" / "viagens"
    data_limite = (HOJE - timedelta(days=HISTORICO_DIAS - 1)).date()
    data_fim = HOJE.date()
    frames = []
    planilha = _carregar_historico_planilha()
    if not planilha.empty:
        historico_planilha = _filtrar_historico_viagens(planilha, data_limite, data_fim)
        if not historico_planilha.empty:
            frames.append(historico_planilha)

    arquivos_lidos = 0

    for arquivo in sorted(pasta_historico.glob("*/resumo_viagens_*.xlsx")):
        try:
            data_relatorio = datetime.strptime(arquivo.parent.name, "%Y-%m-%d").date()
        except ValueError:
            continue
        if not data_limite <= data_relatorio <= data_fim:
            continue

        header = _detectar_header_viagens(arquivo)
        frame = pd.read_excel(arquivo, engine="openpyxl", header=header).dropna(how="all")
        if "Data Entrega" not in frame or "Motorista" not in frame:
            raise RuntimeError(f"Colunas obrigatorias ausentes em {arquivo.name}.")

        delivery_dates = pd.to_datetime(frame["Data Entrega"], errors="coerce")
        frame = frame.loc[delivery_dates.dt.date == data_relatorio].copy()
        frame = _filtrar_historico_viagens(frame, data_limite, data_fim)
        if not frame.empty:
            frames.append(frame)
            arquivos_lidos += 1

    if not frames:
        raise RuntimeError("Nenhum relatorio de viagens com dados foi encontrado.")

    historico = pd.concat(frames, ignore_index=True, sort=False).drop_duplicates()
    log(
        f"Historico de viagens: planilha + {arquivos_lidos} arquivo(s) local(is), "
        f"{len(historico)} linha(s), {historico['Data Entrega'].nunique()} data(s)."
    )
    return historico


def enviar_viagens_para_sheets():
    """Envia o Resumo de Viagens para a aba 'Viagens' do Sheet (Apps Script Web App)."""
    import urllib.request
    import urllib.parse

    if not WEBAPP_URL or not WEBAPP_TOKEN:
        raise RuntimeError(
            "SHEETS_WEBAPP_URL e SHEETS_WEBAPP_TOKEN devem estar configurados para enviar viagens."
        )

    df = carregar_historico_viagens()

    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime("%Y-%m-%d")
    df = df.where(pd.notna(df), "")
    df["Atualizado em"] = datetime.now().strftime("%d/%m/%Y %H:%M")

    csv_bytes = df.to_csv(index=False).encode("utf-8")
    url = WEBAPP_URL + "?" + urllib.parse.urlencode(
        {"token": WEBAPP_TOKEN, "aba": VIAGENS_ABA})
    req = urllib.request.Request(url, data=csv_bytes, method="POST",
                                 headers={"Content-Type": "text/csv; charset=utf-8"})
    log(f"Enviando {len(df)} linhas de viagens ao Web App (aba '{VIAGENS_ABA}')...")
    with urllib.request.urlopen(req, timeout=180) as resp:
        retorno = resp.read().decode("utf-8", errors="replace").strip()
    log(f"Resposta (viagens): {retorno}")
    if not retorno.startswith("OK:"):
        raise RuntimeError(f"O Google Sheets rejeitou o envio de viagens: {retorno}")


async def main():
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    log("=" * 55)
    log("Resumo de Viagens - Diaslog (dia atual)")
    log(f"Destino: {PASTA_SAIDA.resolve()}")
    log("=" * 55)

    arquivo_viagens: Path | None = None

    async with async_playwright() as pw:
        if BROWSER_CHANNEL:
            browser = await pw.chromium.launch(channel=BROWSER_CHANNEL, headless=HEADLESS)
        else:
            browser = await pw.chromium.launch(headless=HEADLESS)
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

    if arquivo_viagens is None:
        raise RuntimeError("O relatório de viagens não foi baixado.")

    enviar_viagens_para_sheets()

    log("Concluido.")


if __name__ == "__main__":
    asyncio.run(main())
