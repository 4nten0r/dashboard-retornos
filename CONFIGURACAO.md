# 📦 Central de Indicadores | Dias+ — Guia de Configuração Completa

## 🔗 Visão Geral da Arquitetura

```
┌─────────────────┐     POST CSV + Token      ┌──────────────────────┐
│  Scripts Python │ ─────────────────────────▶ │  Apps Script Web App │
│ (baixar_*.py)   │                            │  (doPost: escreve)   │
└─────────────────┘                            └──────────┬───────────┘
                                                           │
                                                           ▼
┌─────────────────┐                            ┌──────────────────────┐
│  Dashboards     │ ◀─── GET CSV (gviz/tq) ─── │  Google Sheets       │
│ (index.html,    │     (leitura pública)      │  (abas: Viagens,     │
│  Streamlit)     │                            │   Pendencias)        │
└─────────────────┘                            └──────────────────────┘
```

---

## 📋 Passo a Passo de Configuração

### 1️⃣ Preparar a Planilha Google Sheets

1. Acesse: https://docs.google.com/spreadsheets/d/1yrEfFEEa4rtNcYzkWMjGvFPPuHS5ihauzUeNXORE2M4/edit
2. Certifique-se de que existam duas abas: **"Viagens"** e **"Pendencias"** (o Apps Script cria automaticamente se não existirem)
3. Compartilhe a planilha: **Qualquer pessoa com o link → Leitor** (para leitura pública via gviz/tq)

### 2️⃣ Configurar e Implantar o Apps Script

1. Acesse: https://script.google.com/
2. Clique em **Novo projeto**
3. Cole o código do arquivo `apps_script_code.gs` (que está na raiz do projeto)
4. Salve (Ctrl+S) → Dê um nome: "Dias+ Sheets Web App"
5. **Configure o token de escrita:**
   - No editor do Apps Script, execute a função `configurarToken` uma vez:
     ```javascript
     configurarToken('DIASPlus_2024_SecureToken_XYZ789')
     ```
   - Ou defina manualmente: **Configurações do projeto → Propriedades do script → Adicionar propriedade**
     - Chave: `SHEETS_WEBAPP_TOKEN`
     - Valor: `DIASPlus_2024_SecureToken_XYZ789` (use o mesmo do .env)
6. **Implantar como Web App:**
   - Clique em **Implantar → Nova implantação**
   - Tipo: **Aplicação Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa** (essencial para GET funcionar publicamente)
   - Clique em **Implantar**
   - **Copie a URL do Web App** (algo como: `https://script.google.com/macros/s/AKfycb.../exec`)
### 3️⃣ Atualizar o arquivo `.env`

Edite o arquivo `.env` na raiz do projeto com a URL real do Web App:

```ini
# Credenciais de acesso ao ERP Diaslog
DIASLOG_USUARIO=antenorhpfiuza@gmail.com
DIASLOG_SENHA=123456

# URL do Web App implantado no passo 2 (COLE AQUI A URL REAL)
SHEETS_WEBAPP_URL=https://script.google.com/macros/s/SEU_DEPLOY_ID_REAL/exec

# Token DEVE SER IGUAL ao configurado no Apps Script (passo 2.5)
SHEETS_WEBAPP_TOKEN=DIASPlus_2024_SecureToken_XYZ789
```

### 4️⃣ Instalar Dependências Python

```bash
pip install playwright pandas openpyxl streamlit plotly
playwright install
```

### 5️⃣ Testar a Integração

#### Teste 1: Envio manual de viagens
```bash
py enviar_viagens.py
```
Deve aparecer: `OK: X linhas x Y colunas escritas na aba "Viagens".`

#### Teste 2: Rodar automação completa
```bash
py executar_rotina.py
```
Ou clique duas vezes em `executar_rotina.bat`

#### Teste 3: Visualizar no Dashboard HTML
- Dê duplo clique em `index.html`
- Clique no botão **"🔄 Sincronizar Google Sheets"**

#### Teste 4: Visualizar no Streamlit
```bash
streamlit run app.py
```

---

## 🔧 Como Funcionam os Endpoints

### GET — Leitura (Dashboard)
```
https://script.google.com/macros/s/<DEPLOY_ID>/exec?sheet=Viagens
https://script.google.com/macros/s/<DEPLOY_ID>/exec?sheet=Pendencias
```
- Retorna CSV puro (Content-Type: text/csv)
- Usado pelo `index.html` via `gviz/tq` e pelo Streamlit via `pd.read_csv()`

### POST — Escrita (Scripts Python)
```
POST https://script.google.com/macros/s/<DEPLOY_ID>/exec?token=SEU_TOKEN&aba=Viagens
Content-Type: text/csv; charset=utf-8
Body: CSV data
```
- Requer token válido (configurado em Propriedades do Script)
- `aba` deve ser "Viagens" ou "Pendencias"
- Limpa a aba e escreve os novos dados
- Retorna texto: `OK: X linhas x Y colunas escritas na aba "Viagens".`

---

## 🔐 Segurança

| Componente | Proteção |
|------------|----------|
| **Leitura (Dashboard)** | Pública (planilha compartilhada como "Leitor") |
| **Escrita (Python)** | Token secreto no header/query + HTTPS |
| **Credenciais ERP** | Apenas no `.env` (nunca no Git) |
| **Token Web App** | Nas Propriedades do Apps Script (não no código) |

> ⚠️ **NUNCA** commite o arquivo `.env` ou o token no repositório!

---

## 🐛 Troubleshooting

### "Token inválido ou ausente"
- Verifique se `SHEETS_WEBAPP_TOKEN` no `.env` é **idêntico** ao das Propriedades do Apps Script
- Rode `configurarToken('seu_token')` novamente no Apps Script

### "Sheet not found" / Planilha vazia
- Confirme que a Planilha ID no Apps Script (`1yrEfFEEa4rtNcYzkWMjGvFPPuHS5ihauzUeNXORE2M4`) está correta
- Verifique se as abas "Viagens" e "Pendencias" existem
- Teste leitura direta: `https://docs.google.com/spreadsheets/d/1yrEfFEEa4rtNcYzkWMjGvFPPuHS5ihauzUeNXORE2M4/gviz/tq?tqx=out:csv&sheet=Viagens`

### Erro de CORS no dashboard HTML
- O `gviz/tq` não tem CORS — funciona direto no navegador
- Se der erro, verifique se a planilha está compartilhada como "Qualquer pessoa com o link → Leitor"

### Timeout / Erro 500 no Web App
- Logs: No Apps Script → **Execuções** → veja os erros
- Aumente timeout no Python: `timeout=180` (já configurado)

### "Exception: Argumento inválido: value" ao executar configurarToken
- A função foi corrigida para ter valor padrão. Execute sem parâmetro ou passe a string.
- Ou configure manualmente nas **Propriedades do script** (mais confiável).

---

## 📁 Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `apps_script_code.gs` | **Código do Apps Script** (copie para script.google.com) |
| `.env` | Credenciais ERP + URL Web App + Token |
| `baixar_pendencias.py` | RPA: baixa pendências 90 dias → sobe ao Sheets |
| `baixar_viagens.py` | RPA: baixa viagens do dia → sobe ao Sheets |
| `enviar_viagens.py` | Utilitário: envia arquivo .xlsx avulso para aba Viagens |
| `executar_rotina.py` | Orquestrador: roda viagens + pendências em sequência |
| `comum.py` | Funções compartilhadas (Streamlit + processamento) |
| `app.py` | Roteador Streamlit (páginas: Pendências / Entregas) |
| `paginas/pendencias.py` | Dashboard Streamlit: análise de notas pendentes |
| `paginas/entregas.py` | Dashboard Streamlit: performance de viagens |
| `index.html` | Dashboard Web standalone (Chart.js, Three.js) |

---

## ⏰ Agendamento Automático (Windows Task Scheduler)

1. `Win + R` → `taskschd.msc`
2. **Criar Tarefa Básica** → Nome: "Dias+ Atualização Indicadores"
3. Disparador: **Diariamente** às 06:00 (repete a cada 4h)
4. Ação: **Iniciar programa**
   - Programa: `C:\Users\Antenor.Hugo\Downloads\retorno\executar_rotina.bat`
   - Iniciar em: `C:\Users\Antenor.Hugo\Downloads\retorno\`
5. Concluir

---

## ✅ Checklist Final

- [ ] Planilha Google Sheets acessível (ID: `1yrEfFEEa4rtNcYzkWMjGvFPPuHS5ihauzUeNXORE2M4`)
- [ ] Apps Script implantado como Web App ("Qualquer pessoa")
- [ ] Token configurado nas Propriedades do Script E no `.env`
- [ ] URL do Web App colada no `.env` (`SHEETS_WEBAPP_URL`)
- [ ] `py enviar_viagens.py` funciona (teste de escrita)
- [ ] `py executar_rotina.py` roda sem erros
- [ ] `index.html` abre e sincroniza (botão 🔄)
- [ ] `streamlit run app.py` abre e mostra dados
- [ ] Tarefa agendada no Windows (opcional)

---

**📞 Suporte:** Em caso de dúvidas, verifique os logs no Apps Script (Execuções) e no terminal Python.

---

**📞 Suporte:** Em caso de dúvidas, verifique os logs no Apps Script (Execuções) e no terminal Python.