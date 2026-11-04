# -*- coding: utf-8 -*-
"""Corrige erros do index.html:
1) DEFAULT_SEED corrompido (newlines literais dentro de strings -> SyntaxError)
2) WEBAPP_URL com deploy ID antigo -> URL correta do deploy atual
3) Funcao pushToSheet() chamada mas nunca definida -> adicionada
4) Auto-sync do Google Sheets no boot quando o estado local esta vazio
"""
import re, shutil, sys

P = r"c:\Users\Antenor.Hugo\Downloads\retorno\index.html"

with open(P, "r", encoding="utf-8") as f:
    html = f.read()

orig = html
ok = True

# ---------- Backup ----------
shutil.copyfile(P, P + ".bak")
print("Backup criado: index.html.bak")

# ---------- Fix 1: substituir DEFAULT_SEED corrompido ----------
new_seed = ('const DEFAULT_SEED = { savedAt: null, fv: V_FIELDS, fn: N_FIELDS, '
            'v: [], n: [], imports: [] };\n')
html, n1 = re.subn(r'const DEFAULT_SEED\s*=.*?const LS_KEY',
                   new_seed + 'const LS_KEY', html, count=1, flags=re.S)
print("Fix 1 (DEFAULT_SEED):", "OK" if n1 == 1 else "FALHOU")
ok &= (n1 == 1)

# ---------- Fix 2: corrigir WEBAPP_URL ----------
OLD_URL = 'AKfycbyqPfNsdJGHE_T4K-jj2CH4fqTlDa07ZHW9fa0ai_STQdfrQaG2qp_8obK1bhZ1J0XSRw'
NEW_URL = 'AKfycbxSORqb_SwS6j-GaOUHTKwKarFtQ0dG8S0cVGvX7zpiSHrKemtRlfD04zGuw_IY1-Ijbg'
if OLD_URL in html:
    html = html.replace(OLD_URL, NEW_URL)
    n2 = html.count(NEW_URL)
else:
    n2 = html.count(NEW_URL)
print("Fix 2 (WEBAPP_URL):", "OK" if n2 == 1 else "VERIFICAR (%d)" % n2)
ok &= (n2 == 1)

# ---------- Fix 3: adicionar pushToSheet (se nao existir) ----------
if 'function pushToSheet' not in html:
    push_fn = """
// ---- Envio de novos dados para o Google Sheets via Apps Script (fire-and-forget) ----
const SHEET_TOKEN = 'DIASPlus_2024_SecureToken_XYZ789';
async function pushToSheet(aba, rows) {
  try {
    if (!rows || !rows.length || !WEBAPP_URL) return;
    const fields = Object.keys(rows[0]);
    const esc = x => {
      x = (x == null ? '' : String(x));
      return /[",\\r\\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x;
    };
    const csv = [fields.map(esc).join(',')]
      .concat(rows.map(r => fields.map(f => esc(r[f])).join(',')))
      .join('\\r\\n');
    const url = WEBAPP_URL + '?token=' + encodeURIComponent(SHEET_TOKEN) +
                '&aba=' + encodeURIComponent(aba);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv;charset=utf-8' },
      body: csv,
      redirect: 'follow'
    });
    const txt = (await resp.text()).trim();
    if (txt.toUpperCase().indexOf('OK') === 0) {
      console.info('pushToSheet(' + aba + '):', txt);
    } else {
      console.warn('pushToSheet(' + aba + ') respondeu:', txt);
    }
  } catch (err) {
    console.warn('pushToSheet(' + aba + ') falhou (seguindo sem upload):', err && err.message);
  }
}
"""
    m = re.search(r"^const WEBAPP_URL = 'https://script\.google\.com[^']*';\s*$",
                  html, flags=re.M)
    if m:
        html = html[:m.end()] + "\n" + push_fn + html[m.end():]
        print("Fix 3 (pushToSheet): OK (inserida apos WEBAPP_URL)")
    else:
        print("Fix 3 (pushToSheet): FALHOU (ancora WEBAPP_URL nao encontrada)")
        ok = False
else:
    print("Fix 3 (pushToSheet): ja existe, ignorado")

# ---------- Fix 4: auto-sync no BOOT ----------
boot_anchor = ("if (!S.fv || !S.fn || !S.imports) { S = structuredClone ? "
               "structuredClone(DEFAULT_SEED) : JSON.parse(JSON.stringify(DEFAULT_SEED)); }\r\n  render();")
boot_repl = boot_anchor + "\r\n  // Se o estado local esta vazio, carrega direto do Google Sheets\r\n  if (!S.v.length && !S.n.length) { syncGoogleSheets(); }"
if 'syncGoogleSheets(); }\r\n  init3D' in html or '!S.v.length && !S.n.length' in html:
    print("Fix 4 (auto-sync): ja existe, ignorado")
elif boot_anchor in html:
    html = html.replace(boot_anchor, boot_repl, 1)
    print("Fix 4 (auto-sync): OK (CRLF)")
else:
    boot_anchor_lf = boot_anchor.replace('\r\n', '\n')
    boot_repl_lf = boot_repl.replace('\r\n', '\n')
    if boot_anchor_lf in html:
        html = html.replace(boot_anchor_lf, boot_repl_lf, 1)
        print("Fix 4 (auto-sync): OK (LF)")
    else:
        print("Fix 4 (auto-sync): FALHOU (ancora do BOOT nao encontrada)")
        ok = False

# ---------- Validacoes finais ----------
checks = [
    ('const DEFAULT_SEED', html.count('const DEFAULT_SEED') == 1),
    ('sem pushToSheet indefinida', html.count('pushToSheet(') >= 2 and 'function pushToSheet' in html),
    ('WEBAPP_URL nova presente', NEW_URL in html and OLD_URL not in html),
    ('scripts balanceados', html.count('<script') == html.count('</script>')),
]
for name, passed in checks:
    print("Check:", name, "->", "OK" if passed else "FALHOU")
    ok &= passed

if not ok:
    print("\nHouve falhas — restaurando backup.")
    shutil.copyfile(P + ".bak", P)
    sys.exit(1)

with open(P, "w", encoding="utf-8", newline="") as f:
    f.write(html)

print("\nTodas as correcoes aplicadas e salvas em", P)
